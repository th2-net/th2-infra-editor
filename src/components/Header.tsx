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
import SchemaSelector from './SchemaSelector';
import { BoxEntity } from '../models/Box';
import CreateBoxModal from './groups/CreateBoxModal';
import { ModalPortal } from './Portal';

interface HeaderProps {
	schemaList: string[];
	selectedSchema: string;
	createSchema: (schemaName: string) => void;
	saveChanges: () => void;
	createNewBox: (box: BoxEntity) => void;
}

const Header = ({
	schemaList,
	selectedSchema,
	createSchema,
	saveChanges,
	createNewBox,
}: HeaderProps) => {
	const [isCreateBoxModalOpen, setIsCreateBoxModalOpen] = React.useState(false);

	const createNewSchema = () => {
		// eslint-disable-next-line no-alert
		const schemaName = prompt('Schema name');
		if (schemaName === null) {
			return;
		}
		if (schemaName?.trim()
			&& !schemaName.includes(' ')
			&& !schemaName.includes('_')
			&& !schemaName
				.split('')
				.every(char => char.charCodeAt(0) < 65 && char.charCodeAt(0) > 90)) {
			createSchema(schemaName);
		} else {
			// eslint-disable-next-line no-alert
			alert('Invalid schema name');
		}
	};

	return (
		<>
			<div className='header'>
				<SchemaSelector
					schemaList={schemaList}
					selectedSchema={selectedSchema}
				/>
				<button
					className='button'
					onClick={() => setIsCreateBoxModalOpen(!isCreateBoxModalOpen)}
				>Create new box</button>
				<button
					className='button'
					onClick={createNewSchema}
				>Create new schema</button>
				<button
					className='button'
					onClick={saveChanges}
				>Save changes</button>
			</div>
			<ModalPortal isOpen={isCreateBoxModalOpen}>
				<CreateBoxModal
					createNewBox={createNewBox}
					onClose={() => setIsCreateBoxModalOpen(false)}
				/>
			</ModalPortal>
		</>
	);
};

export default Header;
