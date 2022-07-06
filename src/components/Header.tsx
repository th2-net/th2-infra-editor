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
import { observer } from 'mobx-react-lite';
import CreateBoxModal from './box/CreateBoxModal';
import ChangeLogModal from './changeLog/ChangeLogModal';
import DictionaryModal from './dictionary/DictionaryModal';
import ElementsListModal from './elementsList/ElementsListModal';
import FormModal from './util/FormModal';
import { ModalPortal } from './util/Portal';
import { useInput } from '../hooks/useInput';
import useSchemasStore from '../hooks/useSchemasStore';
import { createBemElement } from '../helpers/styleCreators';
import '../styles/header.scss';

const Header = () => {
	const schemasStore = useSchemasStore();

	const [isCreateSchemaModalOpen, setIsCreateSchemaModalOpen] = React.useState(false);
	const [isCreateBoxModalOpen, setIsCreateBoxModalOpen] = React.useState(false);
	const [isCreateDictionaryModalOpen, setIsCreateDictionaryModalOpen] = React.useState(false);
	const [isElementListOpen, setIsElementListOpen] = React.useState(false);
	const [isChangeLogOpen, setIsChangeLogOpen] = React.useState(false);

	const headerRef = React.useRef<HTMLDivElement>(null);
	const elementsListButtonRef = React.useRef<HTMLButtonElement>(null);

	const schemasNameInput = useInput({
		id: 'schema-name',
		label: 'Schema name',
		validate: value => {
			const trimmedValue = value.trim();
			return (
				Boolean(trimmedValue) &&
				!trimmedValue.includes(' ') &&
				!trimmedValue.includes('_') &&
				!/[A-Z]/g.test(trimmedValue) &&
				!schemasStore.checkSchemaExistingByName(value)
			);
		},
	});

	const saveButtonClass = createBemElement(
		'header',
		'button',
		'save',
		schemasStore.preparedRequests.length === 0 ? 'disable' : null,
		schemasStore.isSaving ? 'loading' : null,
	);

	const elementListClass = createBemElement(
		'header',
		'button',
		'elements',
		isElementListOpen ? 'active' : null,
	);

	const changeLogClass = createBemElement(
		'header',
		'button',
		'changes',
		isChangeLogOpen ? 'active' : null,
	);

	const hiddenBoxesNumber =
		schemasStore.boxes.length - schemasStore.connectedToFilterTargetBoxBoxes.length;

	return (
		<div ref={headerRef} className='header'>
			<div className='header__select-wrapper'>
				<select
					className='header__select'
					onChange={e => schemasStore.setSelectedSchema(e.target.value)}
					value={schemasStore.selectedSchema || undefined}
				>
					{schemasStore.schemas.map(schema => (
						<option key={schema} value={schema}>
							{schema}
						</option>
					))}
				</select>
			</div>
			<button className={saveButtonClass} onClick={schemasStore.saveChanges}>
				<i className='header__button-icon' />
				Save changes
			</button>
			{schemasStore.filterTargetBox && (
				<button
					className='header__button filter'
					onClick={() => schemasStore.setFilterTargetBox(null)}
				>
					<i className='header__button-icon' />
					{`${hiddenBoxesNumber} ${hiddenBoxesNumber === 1 ? 'Box' : 'Boxes'}`} is hidden
				</button>
			)}
			<button
				className='header__button schema'
				onClick={() => setIsCreateSchemaModalOpen(true)}
			>
				<i className='header__button-icon' />
				Create schema
			</button>
			<button className='header__button boxes' onClick={() => setIsCreateBoxModalOpen(true)}>
				<i className='header__button-icon' />
				Create resource
			</button>
			<button
				className='header__button dictionary'
				onClick={() => setIsCreateDictionaryModalOpen(true)}
			>
				<i className='header__button-icon' />
				Create dictionary
			</button>
			<button
				ref={elementsListButtonRef}
				className={elementListClass}
				onClick={() => {
					setIsChangeLogOpen(false);
					setIsElementListOpen(!isElementListOpen);
				}}
			>
				<i className='header__button-icon' />
				Elements list
			</button>
			<button
				className={changeLogClass}
				onClick={() => {
					setIsElementListOpen(false);
					setIsChangeLogOpen(!isChangeLogOpen);
				}}
			>
				<i className='header__button-icon' />
				Change log
			</button>
			<ModalPortal isOpen={isCreateSchemaModalOpen}>
				<FormModal
					title='Create schema'
					configList={[schemasNameInput]}
					onSubmit={() => schemasStore.createSchema(schemasNameInput.value)}
					onClose={() => setIsCreateSchemaModalOpen(false)}
				/>
			</ModalPortal>
			<ModalPortal
				isOpen={isCreateBoxModalOpen}
				closeModal={() => setIsCreateBoxModalOpen(false)}
			>
				<CreateBoxModal
					createBox={schemasStore.createBox}
					checkBoxExistingByName={schemasStore.checkBoxExistingByName}
					typeVariants={schemasStore.groups.flatMap(group => group.types)}
					onClose={() => setIsCreateBoxModalOpen(false)}
				/>
			</ModalPortal>
			<ModalPortal
				isOpen={isCreateDictionaryModalOpen}
				closeModal={() => setIsCreateDictionaryModalOpen(false)}
			>
				<DictionaryModal onClose={() => setIsCreateDictionaryModalOpen(false)} />
			</ModalPortal>
			<ModalPortal
				isOpen={isElementListOpen}
				closeModal={() => setIsCreateDictionaryModalOpen(false)}
			>
				<ElementsListModal
					top={headerRef.current?.clientHeight}
					left={elementsListButtonRef.current?.getBoundingClientRect().left}
					width={
						elementsListButtonRef.current
							? window.innerWidth -
							  elementsListButtonRef.current.getBoundingClientRect().left
							: undefined
					}
					onClose={() => setIsElementListOpen(false)}
				/>
			</ModalPortal>
			<ModalPortal isOpen={isChangeLogOpen}>
				<ChangeLogModal
					top={headerRef.current?.clientHeight}
					left={elementsListButtonRef.current?.getBoundingClientRect().left}
					width={
						elementsListButtonRef.current
							? window.innerWidth -
							  elementsListButtonRef.current.getBoundingClientRect().left
							: undefined
					}
					onClose={() => setIsChangeLogOpen(false)}
				/>
			</ModalPortal>
		</div>
	);
};

export default observer(Header);
