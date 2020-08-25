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

interface HeaderProps {
	schemaList: string[];
	selectedSchema: string;
	createSchema: (schemaName: string) => void;
	saveChanges: () => void;
}

const Header = ({
	schemaList,
	selectedSchema,
	createSchema,
	saveChanges,
}: HeaderProps) => {
	const createNewSchema = () => {
		// eslint-disable-next-line no-alert
		const schemaName = prompt('Schema name');
		if (schemaName?.trim() && !schemaName.includes(' ')) {
			createSchema(schemaName);
		} else {
			// eslint-disable-next-line no-alert
			alert('Invalid schema name');
		}
	};

	return (
		<div className='header'>
			<SchemaSelector
				schemaList={schemaList}
				selectedSchema={selectedSchema}
			/>
			<button
				className='button'
				onClick={createNewSchema}
			>Create new</button>
			<button
				className='button'
				onClick={saveChanges}
			>Save changes</button>
		</div>
	);
};

export default Header;
