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
import { ModalPortal } from './util/Portal';
import useStore from '../hooks/useStore';
import '../styles/header.scss';

const Header = () => {
	const { rootStore } = useStore();

	const [isCreateBoxModalOpen, setIsCreateBoxModalOpen] = React.useState(false);

	const createNewSchema = () => {
		// eslint-disable-next-line no-alert
		const schemaName = prompt('Schema name');
		if (schemaName === null) {
			return;
		}
		const trimmedValue = schemaName?.trim();
		if (
			trimmedValue
			&& !trimmedValue.includes(' ')
			&& !trimmedValue.includes('_')
			&& !/[A-Z]/g.test(trimmedValue)
		) {
			rootStore.createNewSchema(schemaName);
		} else {
			// eslint-disable-next-line no-alert
			alert('Invalid schema name');
		}
	};

	return (
		<div className="header">
			<select
				className="header__select"
				onChange={e => rootStore.setSelectedSchema(e.target.value)}
				value={rootStore.selectedSchema || undefined}
			>
				{
					rootStore.schemas.map(schema => (
						<option key={schema} value={schema}>
							{schema}
						</option>
					))
				}
			</select>
			<button
				className="header__button"
				onClick={() => setIsCreateBoxModalOpen(!isCreateBoxModalOpen)}>
				Create new resource
			</button>
			<button className="header__button" onClick={createNewSchema}>
				Create new schema
			</button>
			<button className="header__button" onClick={rootStore.saveChanges}>
				Save changes
			</button>
			<ModalPortal isOpen={isCreateBoxModalOpen}>
				<CreateBoxModal
					createNewBox={rootStore.createNewBox}
					onClose={() => setIsCreateBoxModalOpen(false)}
				/>
			</ModalPortal>
		</div>
	);
};

export default observer(Header);
