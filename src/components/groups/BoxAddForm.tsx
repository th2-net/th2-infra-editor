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

interface BoxAddFormProps {
	addNewProp: (prop: {
		name: string;
		value: string;
	}, boxName: string) => void;
	closeAddForm: () => void;
	boxName: string;
	isFirstElement: boolean;
}

const BoxAddForm = ({
	addNewProp,
	boxName,
	isFirstElement,
	closeAddForm,
}: BoxAddFormProps) => {
	const [newPropsName, setNewPropsName] = React.useState('');
	const [newPropsValue, setNewPropsValue] = React.useState('');
	const [isNameValid, setIsNameValid] = React.useState(true);
	const [isValueValid, setIsValueValid] = React.useState(true);

	React.useEffect(() => {
		setIsNameValid(newPropsName.length !== 0);
		setIsValueValid(newPropsValue.length !== 0);
	}, [newPropsName, newPropsValue]);

	const addProp = () => {
		if (newPropsName.trim() && newPropsValue.trim()) {
			addNewProp({
				name: newPropsName,
				value: newPropsValue,
			}, boxName);
			closeAddForm();
		}
	};

	const closeForm = () => {
		closeAddForm();
		setNewPropsName('');
		setNewPropsValue('');
	};

	const nameInputClass = createBemElement(
		'box-settings',
		'input',
		!isNameValid ? 'invalid' : '',
	);

	const valueInputClass = createBemElement(
		'box-settings',
		'input',
		!isValueValid ? 'invalid' : '',
	);

	return (
		<div className='box-modal__add-form'>
			{ !isFirstElement && <hr/> }
			<div className="box-settings__group">
				<label
					htmlFor="prop-name"
					className="box-settings__label">
					Prop name
				</label>
				<input
					id="prop-name"
					type="text"
					className={nameInputClass}
					value={newPropsName}
					onChange={e => setNewPropsName(e.target.value)}/>
			</div>
			<div className="box-settings__group">
				<label
					htmlFor="prop-value"
					className="box-settings__label">
					Prop value
				</label>
				<input
					id="prop-value"
					type="text"
					className={valueInputClass}
					value={newPropsValue}
					onChange={e => setNewPropsValue(e.target.value)}/>
			</div>
			<div className="box-modal__buttons">
				<button
					className='box-modal__button'
					onClick={addProp}>
					Save prop
				</button>
				<button
					className="box-modal__button"
					onClick={() => closeForm()}>
					Cancel
				</button>
			</div>
		</div>);
};

export default BoxAddForm;
