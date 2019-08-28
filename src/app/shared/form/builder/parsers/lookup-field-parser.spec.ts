import { FormFieldModel } from '../models/form-field.model';
import { FormFieldMetadataValueObject } from '../models/form-field-metadata-value.model';
import { LookupFieldParser } from './lookup-field-parser';
import { DynamicLookupModel } from '../ds-dynamic-form-ui/models/lookup/dynamic-lookup.model';
import { ParserOptions } from './parser-options';
import { WorkspaceItem } from '../../../../core/submission/models/workspaceitem.model';

describe('LookupFieldParser test suite', () => {
  let field: FormFieldModel;
  let initFormValues = {};

  const parserOptions: ParserOptions = {
    readOnly: false,
    submissionScope: 'testScopeUUID',
    authorityUuid: null
  };

  beforeEach(() => {
    field = {
      input: {
        type: 'lookup'
      },
      label: 'Journal',
      mandatory: 'false',
      repeatable: false,
      hints: 'Enter the name of the journal where the item has been published, if any.',
      selectableMetadata: [
        {
          metadata: 'journal',
          authority: 'JOURNALAuthority',
          closed: false
        }
      ],
      languageCodes: []
    } as FormFieldModel;

  });

  it('should init parser properly', () => {
    const parser = new LookupFieldParser(field, initFormValues, parserOptions, new WorkspaceItem());

    expect(parser instanceof LookupFieldParser).toBe(true);
  });

  it('should return a DynamicLookupModel object when repeatable option is false', () => {
    const parser = new LookupFieldParser(field, initFormValues, parserOptions, new WorkspaceItem());

    const fieldModel = parser.parse();

    expect(fieldModel instanceof DynamicLookupModel).toBe(true);
  });

  it('should set init value properly', () => {
    initFormValues = {
      journal: [new FormFieldMetadataValueObject('test journal')],
    };
    const expectedValue = new FormFieldMetadataValueObject('test journal');

    const parser = new LookupFieldParser(field, initFormValues, parserOptions, new WorkspaceItem());

    const fieldModel = parser.parse();

    expect(fieldModel.value).toEqual(expectedValue);
  });

});
