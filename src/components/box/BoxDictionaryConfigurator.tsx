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
import { createBemElement } from '../../helpers/styleCreators';
import { useInput } from '../../hooks/useInput';
import { DictionaryRelation } from '../../models/Box';

interface BoxAddFormProps {
	addDictionaryRelation: (dictionaryRelation: DictionaryRelation) => void;
	closeAddForm: () => void;
	boxName: string;
}

const BoxDictionaryConfigurator = ({
	addDictionaryRelation,
	boxName,
	closeAddForm,
}: BoxAddFormProps) => {
	const nameInput = useInput({
		initialValue: '',
		validate: value => value.trim().length !== 0,
	});
	const dictionaryNameInput = useInput({
		initialValue: '',
		validate: value => value.trim().length !== 0,
	});

	const dictionaryTypeInput = useInput({
		initialValue: '',
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

	const nameInputClass = createBemElement(
		'box-settings',
		'input',
		!nameInput.isValid && nameInput.isDirty ? 'invalid' : '',
	);

	const dictionaryNameInputClass = createBemElement(
		'box-settings',
		'input',
		!dictionaryTypeInput.isValid && dictionaryNameInput.isDirty ? 'invalid' : '',
	);

	const dictionaryTypeInputClass = createBemElement(
		'box-settings',
		'input',
		!dictionaryTypeInput.isValid && dictionaryTypeInput.isDirty ? 'invalid' : '',
	);

	return (
		<div className='box-modal__add-form'>
			<div className="box-settings__group">
				<label
					htmlFor="name"
					className="box-settings__label">
					Name
				</label>
				<input
					id="name"
					type="text"
					className={nameInputClass}
					{...nameInput.bind}/>
			</div>
			<div className="box-settings__group">
				<label
					htmlFor="dictionary-name"
					className="box-settings__label">
					Dictionary name
				</label>
				<input
					id="prop-value"
					type="text"
					className={dictionaryNameInputClass}
					{...dictionaryNameInput.bind}/>
			</div>
			<div className="box-settings__group">
				<label
					htmlFor="dictionary-type"
					className="box-settings__label">
					Dictionary type
				</label>
				<input
					id="dictionary-type"
					type="text"
					className={dictionaryTypeInputClass}
					{...dictionaryTypeInput.bind}/>
			</div>
			<div className="box-modal__buttons">
				<button className='box-modal__button' onClick={addRelation}>
					Save
				</button>
				<button className="box-modal__button" onClick={closeForm}>
					Cancel
				</button>
			</div>
		</div>
	);
};

export default BoxDictionaryConfigurator;
