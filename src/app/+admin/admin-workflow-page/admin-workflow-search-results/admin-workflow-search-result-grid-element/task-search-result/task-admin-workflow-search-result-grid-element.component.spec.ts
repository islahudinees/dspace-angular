import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs/internal/Observable';
import { BitstreamDataService } from '../../../../../core/data/bitstream-data.service';
import { RemoteData } from '../../../../../core/data/remote-data';
import { Bitstream } from '../../../../../core/shared/bitstream.model';
import { Item } from '../../../../../core/shared/item.model';
import { mockTruncatableService } from '../../../../../shared/mocks/mock-trucatable.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { createSuccessfulRemoteDataObject$ } from '../../../../../shared/testing/utils';
import { TruncatableService } from '../../../../../shared/truncatable/truncatable.service';
import { CollectionElementLinkType } from '../../../../../shared/object-collection/collection-element-link.type';
import { ViewMode } from '../../../../../core/shared/view-mode.model';
import { RouterTestingModule } from '@angular/router/testing';
import { TaskAdminWorkflowSearchResultGridElementComponent } from './task-admin-workflow-search-result-grid-element.component';
import { TaskObject } from '../../../../../core/tasks/models/task-object.model';
import { SearchResult } from '../../../../../shared/search/search-result.model';
import { LinkService } from '../../../../../core/cache/builders/link.service';
import { getMockLinkService } from '../../../../../shared/mocks/mock-link-service';
import { WorkflowItem } from '../../../../../core/submission/models/workflowitem.model';
import { followLink } from '../../../../../shared/utils/follow-link-config.model';

describe('TaskAdminWorkflowSearchResultGridElementComponent', () => {
  let component: TaskAdminWorkflowSearchResultGridElementComponent;
  let fixture: ComponentFixture<TaskAdminWorkflowSearchResultGridElementComponent>;
  let id;
  let searchResult;
  let linkService;

  const mockBitstreamDataService = {
    getThumbnailFor(item: Item): Observable<RemoteData<Bitstream>> {
      return createSuccessfulRemoteDataObject$(new Bitstream());
    }
  };

  function init() {
    id = '780b2588-bda5-4112-a1cd-0b15000a5339';
    searchResult = new SearchResult<TaskObject>();
    searchResult.indexableObject = new TaskObject();
    searchResult.indexableObject.workflowitem = createSuccessfulRemoteDataObject$(new WorkflowItem());
    searchResult.indexableObject.uuid = id;
    linkService = getMockLinkService();
  }

  beforeEach(async(() => {
    init();
    TestBed.configureTestingModule(
      {
        declarations: [TaskAdminWorkflowSearchResultGridElementComponent],
        imports: [
          NoopAnimationsModule,
          TranslateModule.forRoot(),
          RouterTestingModule.withRoutes([]),
          SharedModule
        ],
        providers: [
          { provide: TruncatableService, useValue: mockTruncatableService },
          { provide: BitstreamDataService, useValue: mockBitstreamDataService },
          { provide: LinkService, useValue: linkService },
        ],
        schemas: [NO_ERRORS_SCHEMA]
      })
      .compileComponents();
  }));

  beforeEach(() => {
    linkService.resolveLink.and.callFake((a) => a);
    fixture = TestBed.createComponent(TaskAdminWorkflowSearchResultGridElementComponent);
    component = fixture.componentInstance;
    component.object = searchResult;
    component.linkTypes = CollectionElementLinkType;
    component.index = 0;
    component.viewModes = ViewMode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should retrieve the workflow item using the link service', () => {
    expect(linkService.resolveLink).toHaveBeenCalledWith(searchResult.indexableObject, followLink('workflowitem'));
  });
});
