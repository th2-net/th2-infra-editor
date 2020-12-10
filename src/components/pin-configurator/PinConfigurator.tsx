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
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { Pin } from '../../models/Box';
import { useInput } from '../../hooks/useInput';
import Input from '../util/Input';
import AttributesList from './AttributesList';
import FiltersList from './FiltersList';
import { createBemElement } from '../../helpers/styleCreators';
import { isEqual } from '../../helpers/object';
import { openDecisionModal } from '../../helpers/modal';

interface PinConfiguratorProps {
	pin: Pin;
	boxName: string;
	configuratePin: (pin: Pin, boxName: string) => void;
	onClose: () => void;
	connectionTypes: string[];
}

const PinConfigurator = ({
	pin,
	boxName,
	onClose,
	configuratePin,
	connectionTypes,
}: PinConfiguratorProps) => {
	const [currentSection, setCurrentSection] = React.useState<'config' | 'attributes' | 'filters'>(
		'config',
	);

	const [editablePin, setEditablePin] = React.useState<Pin>(pin);
	const [isUpdated, setIsUpdated] = React.useState(false);

	React.useEffect(() => {
		if (!isEqual(editablePin, pin)) {
			setIsUpdated(true);
		}
	}, [pin]);

	const [attributes, setAttributes] = React.useState(editablePin.attributes);
	const [filters, setFilters] = React.useState(() => editablePin.filters ?? []);

	const [isAttributeFormOpen, setIsAttributeFormOpen] = React.useState(false);
	const [isFilterFormOpen, setIsFilterFormOpen] = React.useState(false);

	const editorRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(editorRef, (e: MouseEvent) => {
		if (
			!e
				.composedPath()
				.some(elem => elem instanceof HTMLElement && elem.className.includes('modal'))
		) {
			onClose();
		}
	});

	const connectionTypeInput = useInput({
		initialValue: editablePin['connection-type'],
		label: 'Connection type',
		id: 'pin-connection-type',
		validate: value => connectionTypes.includes(value),
		autocomplete: {
			datalistKey: 'pin-configurator__connection-type',
			variants: connectionTypes,
		},
	});

	const configButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		currentSection === 'config' ? 'active' : 'null',
	);

	const attributesButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		'pins',
		currentSection === 'attributes' ? 'active' : 'null',
	);

	const filtersButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		currentSection === 'filters' ? 'active' : 'null',
	);

	const submit = async () => {
		if (connectionTypeInput.isValid && connectionTypeInput.value.trim()) {
			if (!isUpdated) {
				onClose();
				saveChanges();
			} else {
				onClose();
				await openDecisionModal('Resource has been updated', {
					mainVariant: {
						title: 'Rewrite',
						func: saveChanges,
					},
					variants: [
						{
							title: 'Update',
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							func: () => {},
						},
					],
				});
			}
		}
	};

	const saveChanges = () => {
		configuratePin(
			{
				name: pin.name,
				'connection-type': connectionTypeInput.value as 'mq' | 'grpc',
				attributes,
				filters,
			},
			boxName,
		);
	};

	const updateChanges = () => {
		setEditablePin(pin);
		setIsUpdated(false);
	};

	return (
		<div ref={editorRef} className='modal'>
			<div className='modal__header'>
				<h3 className='modal__header-title'>{editablePin.name}</h3>
				<button onClick={onClose} className='modal__header-close-button'>
					<i className='modal__header-close-button-icon' />
				</button>
			</div>
			<div className='modal__content'>
				{isUpdated && (
					<div className='modal__update'>
						<button onClick={updateChanges} className='modal__update-button'>
							Update
						</button>
						<span className='modal__update-message'>Pin has been changed</span>
					</div>
				)}
				<div className='modal__content-switcher'>
					<div onClick={() => setCurrentSection('config')} className={configButtonClass}>
						Pin config
					</div>
					<div
						onClick={() => setCurrentSection('attributes')}
						className={attributesButtonClass}>
						{`${attributes.length} ${
							attributes.length === 1 ? 'attribute' : 'attributes'
						}`}
					</div>
					<div
						onClick={() => setCurrentSection('filters')}
						className={filtersButtonClass}>
						{`${filters.length} ${filters.length === 1 ? 'filter' : 'filters'}`}
					</div>
				</div>
				{currentSection === 'config' && (
					<Input key={connectionTypeInput.bind.id} inputConfig={connectionTypeInput} />
				)}
			</div>
			{currentSection === 'attributes' && (
				<AttributesList
					attributes={attributes}
					addAttribute={attribute => setAttributes([...attributes, attribute])}
					removeAttribute={deletedAttribute =>
						setAttributes(
							attributes.filter(attribute => attribute !== deletedAttribute),
						)
					}
					changeAttributesList={changedAttributesList =>
						setAttributes(changedAttributesList)
					}
					isFormOpen={isAttributeFormOpen}
				/>
			)}
			{currentSection === 'filters' && (
				<FiltersList
					filters={filters}
					addFilter={filter => setFilters([...filters, filter])}
					removeFilter={deletedFilter =>
						setFilters(filters.filter(filter => filter !== deletedFilter))
					}
					changeFiltersList={changedFiltersList => setFilters(changedFiltersList)}
					isFormOpen={isFilterFormOpen}
				/>
			)}
			<div className='modal__buttons'>
				{currentSection === 'attributes' && (
					<button
						onClick={() => setIsAttributeFormOpen(true)}
						className='modal__button add'>
						<i className='modal__button-icon' />
						Add attribute
					</button>
				)}
				{currentSection === 'filters' && (
					<button onClick={() => setIsFilterFormOpen(true)} className='modal__button add'>
						<i className='modal__button-icon' />
						Add filter
					</button>
				)}
				<button onClick={submit} className='modal__button submit'>
					<i className='modal__button-icon' />
					Submit
				</button>
			</div>
		</div>
	);
};

export default PinConfigurator;
