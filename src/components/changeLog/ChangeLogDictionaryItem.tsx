/** *****************************************************************************
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
import { Snapshot } from '../../models/History';

interface ChangeLogDictionaryItemProps {
	snapshot: Snapshot;
}

const ChangeLogDictionaryItem = ({
	snapshot,
}: ChangeLogDictionaryItemProps) => {
	const getSnapshotTitle = () => {
		if (snapshot.changeList.length === 1) {
			const action = snapshot.operation === 'add'
				? 'create'
				: snapshot.operation === 'remove'
					? 'deleted'
					: 'changed';
			return `${snapshot.object} was ${action}`;
		}
		return snapshot.object;
	};

	return (
		<div className="element empty">
			<div className="element__header ">
				<i className="element__header-icon dictionary" />
				<span className="element__title">{getSnapshotTitle()}</span>
			</div>
		</div>
	);
};

export default ChangeLogDictionaryItem;
