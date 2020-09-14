/* eslint-disable no-alert */
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

interface AttributeProps {
	attribute: string;
	changeAttribute: (oldValue: string, newValue: string) => void;
	removeAttribute: (attribute: string, pinName: string, boxName: string) => void;
	boxName: string;
	pinName: string;
}

const Attribute = ({
	attribute,
	changeAttribute,
	removeAttribute,
	boxName,
	pinName,
}: AttributeProps) => {
	const [isEdited, setIsEdited] = React.useState(false);
	const [savedValue, setSavedValue] = React.useState('');

	const attributeInput = useInput({
		initialValue: attribute,
		id: `attribute-${attribute}`,
		name: 'attribute',
	});

	return (
		<div className="pin-configurator__attribute">
			{
				!isEdited
					? (
						<>
							<div className='pin-configurator__attribute-value'>
								{attributeInput.value}
							</div>
							<button
								onClick={() => {
									setSavedValue(attributeInput.value);
									setIsEdited(true);
								}}
								className='pin-configurator__attribute-button'>
								<i className='pin-configurator__attribute-button-icon edit'></i>
							</button>
							<button
								onClick={() => removeAttribute(attribute, pinName, boxName)}
								className='pin-configurator__attribute-button'>
								<i className='pin-configurator__attribute-button-icon delete'></i>
							</button>
						</>
					)
					: (
						<>
							<input
								id={attributeInput.bind.id}
								type="text"
								className='box-settings__input'
								{...attributeInput.bind}/>
							<button
								onClick={() => {
									setIsEdited(false);
									changeAttribute(attribute, attributeInput.value);
								}}
								className='pin-configurator__attribute-button'>
								<i className='pin-configurator__attribute-button-icon submit'></i>
							</button>
							<button
								onClick={() => {
									attributeInput.setValue(savedValue);
									setIsEdited(false);
								}}
								className='pin-configurator__attribute-button'>
								<i className='pin-configurator__attribute-button-icon close'></i>
							</button>
						</>
					)
			}
		</div>
	);
};

interface AttributesListProps {
	attributes: string[];
	addAttribute: (attribute: string, pinName: string, boxName: string) => void;
	removeAttribute: (attribute: string, pinName: string, boxName: string) => void;
	changeAttributesList: (attributes: string[]) => void;
	boxName: string;
	pinName: string;
}

const AttributesList = ({
	attributes,
	addAttribute,
	removeAttribute,
	changeAttributesList,
	boxName,
	pinName,
}: AttributesListProps) => {
	const [isAddAttributeFormOpen, setIsAddAttributeFormOpen] = React.useState(false);

	const addInput = useInput({
		initialValue: '',
		id: 'pin-attribute',
	});

	const addNewAttribute = () => {
		addAttribute(addInput.value, pinName, boxName);
		setIsAddAttributeFormOpen(false);
	};

	const changeAttribute = (oldValue: string, newValue: string) => {
		const attributeIndex = attributes.findIndex(attribute => attribute === oldValue);
		changeAttributesList([
			...attributes.slice(0, attributeIndex),
			newValue,
			...attributes.slice(attributeIndex + 1, attributes.length),
		]);
	};

	return (
    	<div
			className="box-settings__group">
			<span
				className="box-settings__label">
				Attributes
			</span>
			<div className="pin-configurator__attributes-list-wrapper">
				<div className="pin-configurator__attributes-list">
					{
						attributes && attributes.map(attribute =>
							<Attribute
								key={attribute}
								attribute={attribute}
								changeAttribute={changeAttribute}
								removeAttribute={removeAttribute}
								boxName={boxName}
								pinName={pinName}/>)
					}
					{
						isAddAttributeFormOpen
						&& <div className="pin-configurator__attribute">
							<input
								id={addInput.bind.id}
								type="text"
								className='box-settings__input'
								{...addInput.bind}/>
							<button
								onClick={() => addNewAttribute()}
								className='pin-configurator__attribute-button'>
								<i className='pin-configurator__attribute-button-icon submit'></i>
							</button>
							<button
								onClick={() => setIsAddAttributeFormOpen(false)}
								className='pin-configurator__attribute-button'>
								<i className='pin-configurator__attribute-button-icon close'></i>
							</button>
						</div>
					}
				</div>
				<div className="pin-configurator__buttons">
					<button
						onClick={() => setIsAddAttributeFormOpen(true)}
						className="pin-configurator__button"
					>Add</button>
				</div>
			</div>
		</div>
	);
};

export default AttributesList;
