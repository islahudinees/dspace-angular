import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subject,
  Subscription
} from 'rxjs';
import { distinctUntilChanged, map, switchMap, take, tap } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RemoteDataBuildService } from '../../../../../core/cache/builders/remote-data-build.service';
import { PaginatedList } from '../../../../../core/data/paginated-list';
import { RemoteData } from '../../../../../core/data/remote-data';
import { hasNoValue, hasValue, isNotEmpty } from '../../../../empty.util';
import { EmphasizePipe } from '../../../../utils/emphasize.pipe';
import { FacetValue } from '../../../facet-value.model';
import { SearchFilterConfig } from '../../../search-filter-config.model';
import { SearchService } from '../../../../../core/shared/search/search.service';
import { FILTER_CONFIG, IN_PLACE_SEARCH, SearchFilterService } from '../../../../../core/shared/search/search-filter.service';
import { SearchConfigurationService } from '../../../../../core/shared/search/search-configuration.service';
import { getSucceededRemoteData } from '../../../../../core/shared/operators';
import { InputSuggestion } from '../../../../input-suggestions/input-suggestions.model';
import { SearchOptions } from '../../../search-options.model';
import { SEARCH_CONFIG_SERVICE } from '../../../../../+my-dspace-page/my-dspace-page.component';
import { currentPath } from '../../../../utils/route.utils';
import { getFacetValueForType, stripOperatorFromFilterValue } from '../../../search.utils';

@Component({
  selector: 'ds-search-facet-filter',
  template: ``,
})

/**
 * Super class for all different representations of facets
 */
export class SearchFacetFilterComponent implements OnInit, OnDestroy {
  /**
   * Emits an array of pages with values found for this facet
   */
  filterValues$: Subject<RemoteData<Array<PaginatedList<FacetValue>>>>;

  /**
   * Emits the current last shown page of this facet's values
   */
  currentPage: Observable<number>;

  /**
   * Emits true if the current page is also the last page available
   */
  isLastPage$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  /**
   * The value of the input field that is used to query for possible values for this filter
   */
  filter: string;

  /**
   * List of subscriptions to unsubscribe from
   */
  protected subs: Subscription[] = [];

  /**
   * Emits the result values for this filter found by the current filter query
   */
  filterSearchResults: Observable<InputSuggestion[]> = observableOf([]);

  /**
   * Emits the active values for this filter
   */
  selectedValues$: Observable<FacetValue[]>;
  protected collapseNextUpdate = true;

  /**
   * State of the requested facets used to time the animation
   */
  animationState = 'loading';

  /**
   * Emits all current search options available in the search URL
   */
  searchOptions$: Observable<SearchOptions>;

  /**
   * The current URL
   */
  currentUrl: string;

  constructor(protected searchService: SearchService,
              protected filterService: SearchFilterService,
              protected rdbs: RemoteDataBuildService,
              protected router: Router,
              @Inject(SEARCH_CONFIG_SERVICE) public searchConfigService: SearchConfigurationService,
              @Inject(IN_PLACE_SEARCH) public inPlaceSearch: boolean,
              @Inject(FILTER_CONFIG) public filterConfig: SearchFilterConfig) {
  }

  /**
   * Initializes all observable instance variables and starts listening to them
   */
  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.filterValues$ = new BehaviorSubject(new RemoteData(true, false, undefined, undefined, undefined));
    this.currentPage = this.getCurrentPage().pipe(distinctUntilChanged());

    this.searchOptions$ = this.searchConfigService.searchOptions;
    this.subs.push(this.searchOptions$.subscribe(() => this.updateFilterValueList()));
    const facetValues$ = observableCombineLatest(this.searchOptions$, this.currentPage).pipe(
      map(([options, page]) => {
        return { options, page }
      }),
      switchMap(({ options, page }) => {
        return this.searchService.getFacetValuesFor(this.filterConfig, page, options)
          .pipe(
            getSucceededRemoteData(),
            map((results) => {
                return {
                  values: observableOf(results),
                  page: page
                };
              }
            )
          )
      })
    );

    let filterValues = [];
    this.subs.push(facetValues$.subscribe((facetOutcome) => {
      const newValues$ = facetOutcome.values;

      if (this.collapseNextUpdate) {
        this.showFirstPageOnly();
        facetOutcome.page = 1;
        this.collapseNextUpdate = false;
      }
      if (facetOutcome.page === 1) {
        filterValues = [];
      }

      filterValues = [...filterValues, newValues$];

      this.subs.push(this.rdbs.aggregate(filterValues).pipe(
        tap((rd: RemoteData<Array<PaginatedList<FacetValue>>>) => {
          this.selectedValues$ = this.filterService.getSelectedValuesForFilter(this.filterConfig).pipe(
            map((selectedValues) => {
              return selectedValues.map((value: string) => {
                const fValue = [].concat(...rd.payload.map((page) => page.page)).find((facetValue: FacetValue) => this.getFacetValue(facetValue) === value);
                if (hasValue(fValue)) {
                  return fValue;
                }
                return Object.assign(new FacetValue(), { label: stripOperatorFromFilterValue(value), value: value });
              });
            })
          );
        })
      ).subscribe((rd: RemoteData<Array<PaginatedList<FacetValue>>>) => {
        this.animationState = 'ready';
        this.filterValues$.next(rd);

      }));
      this.subs.push(newValues$.pipe(take(1)).subscribe((rd) => {
        this.isLastPage$.next(hasNoValue(rd.payload.next))
      }));
    }));

  }

  /**
   * Prepare for refreshing the values of this filter
   */
  updateFilterValueList() {
    this.animationState = 'loading';
    this.collapseNextUpdate = true;
    this.filter = '';
  }

  /**
   * Checks if a value for this filter is currently active
   */
  isChecked(value: FacetValue): Observable<boolean> {
    return this.filterService.isFilterActiveWithValue(this.filterConfig.paramName, value.value);
  }

  /**
   * @returns {string} The base path to the search page, or the current page when inPlaceSearch is true
   */
  public getSearchLink(): string {
    if (this.inPlaceSearch) {
      return currentPath(this.router);
    }
    return this.searchService.getSearchLink();
  }

  /**
   * @returns {string[]} The base path to the search page, or the current page when inPlaceSearch is true, split in separate pieces
   */
  public getSearchLinkParts(): string[] {
    if (this.inPlaceSearch) {
      return [];
    }
    return this.getSearchLink().split('/');
  }

  /**
   * Show the next page as well
   */
  showMore() {
    this.filterService.incrementPage(this.filterConfig.name);
  }

  /**
   * Make sure only the first page is shown
   */
  showFirstPageOnly() {
    this.filterService.resetPage(this.filterConfig.name);
  }

  /**
   * @returns {Observable<number>} The current page of this filter
   */
  getCurrentPage(): Observable<number> {
    return this.filterService.getPage(this.filterConfig.name);
  }

  /**
   * Submits a new active custom value to the filter from the input field
   * @param data The string from the input field
   */
  onSubmit(data: any) {
    this.selectedValues$.pipe(take(1)).subscribe((selectedValues) => {
        if (isNotEmpty(data)) {
          this.router.navigate(this.getSearchLinkParts(), {
            queryParams:
              {
                [this.filterConfig.paramName]: [
                  ...selectedValues.map((facet) => this.getFacetValue(facet)),
                  data
                ]
              },
            queryParamsHandling: 'merge'
          });
          this.filter = '';
        }
        this.filterSearchResults = observableOf([]);
      }
    )
  }

  /**
   * On click, set the input's value to the clicked data
   * @param data The value of the option that was clicked
   */
  onClick(data: any) {
    this.filter = data;
  }

  /**
   * For usage of the hasValue function in the template
   */
  hasValue(o: any): boolean {
    return hasValue(o);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  ngOnDestroy(): void {
    this.subs
      .filter((sub) => hasValue(sub))
      .forEach((sub) => sub.unsubscribe());
  }

  /**
   * Updates the found facet value suggestions for a given query
   * Transforms the found values into display values
   * @param data The query for which is being searched
   */
  findSuggestions(data): void {
    if (isNotEmpty(data)) {
      this.searchOptions$.pipe(take(1)).subscribe(
        (options) => {
          this.filterSearchResults = this.searchService.getFacetValuesFor(this.filterConfig, 1, options, data.toLowerCase())
            .pipe(
              getSucceededRemoteData(),
              map(
                (rd: RemoteData<PaginatedList<FacetValue>>) => {
                  return rd.payload.page.map((facet) => {
                    return {
                      displayValue: this.getDisplayValue(facet, data),
                      value: this.getFacetValue(facet)
                    }
                  })
                }
              ))
        }
      )
    } else {
      this.filterSearchResults = observableOf([]);
    }
  }

  /**
   * Retrieve facet value
   */
  protected getFacetValue(facet: FacetValue): string {
    return getFacetValueForType(facet, this.filterConfig);
  }

  /**
   * Transforms the facet value string, so if the query matches part of the value, it's emphasized in the value
   * @param {FacetValue} facet The value of the facet as returned by the server
   * @param {string} query The query that was used to search facet values
   * @returns {string} The facet value with the query part emphasized
   */
  getDisplayValue(facet: FacetValue, query: string): string {
    return new EmphasizePipe().transform(facet.value, query) + ' (' + facet.count + ')';
  }

  /**
   * Prevent unnecessary rerendering
   */
  trackUpdate(index, value: FacetValue) {
    return value ? value._links.search.href : undefined;
  }
}

export const facetLoad = trigger('facetLoad', [
  state('ready', style({ opacity: 1 })),
  state('loading', style({ opacity: 0 })),
  transition('loading <=> ready', animate(100)),
]);
