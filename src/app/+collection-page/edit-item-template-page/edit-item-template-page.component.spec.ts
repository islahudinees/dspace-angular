import { EditItemTemplatePageComponent } from './edit-item-template-page.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';
import { ItemTemplateDataService } from '../../core/data/item-template-data.service';
import { ActivatedRoute } from '@angular/router';
import { of as observableOf } from 'rxjs/internal/observable/of';
import { Collection } from '../../core/shared/collection.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { createSuccessfulRemoteDataObject } from '../../shared/remote-data.utils';
import { getCollectionEditRoute } from '../collection-page-routing-paths';

describe('EditItemTemplatePageComponent', () => {
  let comp: EditItemTemplatePageComponent;
  let fixture: ComponentFixture<EditItemTemplatePageComponent>;
  let itemTemplateService: ItemTemplateDataService;
  let collection: Collection;

  beforeEach(async(() => {
    collection = Object.assign(new Collection(), {
      uuid: 'collection-id',
      id: 'collection-id',
      name: 'Fake Collection'
    });
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), SharedModule, CommonModule, RouterTestingModule],
      declarations: [EditItemTemplatePageComponent],
      providers: [
        { provide: ItemTemplateDataService, useValue: {} },
        { provide: ActivatedRoute, useValue: { parent: { data: observableOf({ dso: createSuccessfulRemoteDataObject(collection) }) } } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditItemTemplatePageComponent);
    comp = fixture.componentInstance;
    itemTemplateService = (comp as any).itemTemplateService;
    fixture.detectChanges();
  });

  describe('getCollectionEditUrl', () => {
    it('should return the collection\'s edit url', () => {
      const url = comp.getCollectionEditUrl(collection);
      expect(url).toEqual(getCollectionEditRoute(collection.uuid));
    });
  });
});
