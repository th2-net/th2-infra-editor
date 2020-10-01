/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { useInput } from '../../hooks/useInput';
import { DictionaryRelation } from '../../models/Dictionary';
import Input from '../util/Input';

interface BoxDictionaryConfiguratorProps {
	isAddFormOpen: boolean;
	addDictionaryRelation: (dictionaryRelation: DictionaryRelation) => void;
	removeDictionaryRelation: (dictionaryRelation: DictionaryRelation) => void;
	closeAddForm: () => void;
	boxName: string;
	relatedDictionary: DictionaryRelation[];
	dictionaryNamesList: string[];
}

const BoxDictionaryConfigurator = ({
	isAddFormOpen,
	addDictionaryRelation,
	removeDictionaryRelation,
	boxName,
	closeAddForm,
	relatedDictionary,
	dictionaryNamesList,
}: BoxDictionaryConfiguratorProps) => {
	const nameInput = useInput({
		initialValue: '',
		label: 'Name',
		id: 'name',
		validate: value => value.trim().length !== 0,
	});
	const dictionaryNameInput = useInput({
		initialValue: '',
		label: 'Dictionary name',
		id: 'dictionary-name',
		validate: value => value.trim().length !== 0,
		autocomplete: {
			variants: dictionaryNamesList,
			datalistKey: 'add-form__dictionary-name',
		},
	});

	const dictionaryTypeInput = useInput({
		initialValue: '',
		label: 'Dictionary type',
		id: 'dictionary-type',
		validate: value => value.trim().length !== 0,
	});

	const inputs = [nameInput, dictionaryNameInput, dictionaryTypeInput];

	const addRelation = () => {
		if (inputs.every(input => input.isValid) && boxName) {
			addDictionaryRelation({
				name: nameInput.value,
				box: boxName,
				dictionary: {
					name: dictionaryNameInput.value,
					type: dictionaryTypeInput.value,
				},
			});
			closeAddForm();
		}
	};

	const closeForm = () => {
		closeAddForm();
		nameInput.reset();
		dictionaryNameInput.reset();
		dictionaryTypeInput.reset();
	};

	return (
		<div className='box-modal__dictionary-configurator'>
			{
				relatedDictionary.map(relation => (
					<div
						key={relation.name}
						className='box-modal__dictionary-relation'>
						<div className="box-modal__dictionary-relation-prop">
							<div className="box-settings__label">Name</div>
							<div className="box-modal__dictionary-relation-prop-value">
								{relation.name}
							</div>
						</div>
						<div className="box-modal__dictionary-relation-prop">
							<div className="box-settings__label">Dictionary name</div>
							<div className="box-modal__dictionary-relation-prop-value">
								{relation.dictionary.name}
							</div>
						</div>
						<div className="box-modal__dictionary-relation-prop">
							<div className="box-settings__label">Dictionary type</div>
							<div className="box-modal__dictionary-relation-prop-value">
								{relation.dictionary.type}
							</div>
						</div>
						<button
							onClick={() => removeDictionaryRelation(relation)}
							className="box-modal__dictionary-relation-button">
							<i className="box-modal__dictionary-relation-button-icon delete"/>
						</button>
					</div>
				))
			}
			{
				isAddFormOpen
				&& <div className="box-modal__add-form">
					<Input inputConfig={nameInput}/>
					<Input inputConfig={dictionaryNameInput}/>
					<Input inputConfig={dictionaryTypeInput}/>
					<div className="box-modal__buttons">
						<button className='box-modal__button' onClick={addRelation}>
							Save
						</button>
						<button className="box-modal__button" onClick={closeForm}>
							Cancel
						</button>
					</div>
				</div>
			}
		</div>
	);
};

export default BoxDictionaryConfigurator;
