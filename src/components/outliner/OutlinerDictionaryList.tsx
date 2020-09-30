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
import { downloadFile } from '../../helpers/files';
import { DictionaryEntity } from '../../models/Dictionary';

export interface OutlinerDictionaryListProps {
	dictionaryList: DictionaryEntity[];
}

const OutlinerDictionaryList = ({
	dictionaryList,
}: OutlinerDictionaryListProps) =>
	<div className="outliner__list">
		{
			dictionaryList.map(dictionary => (
				<div
					key={dictionary.name}
					className="outliner__list-item">
					<div className="outliner__item-info">
						<span className="outliner__info-key">Dictionary name:</span>
						<span className="outliner__info-value">{dictionary.name}</span>
					</div>
					<div className="outliner__item-control-buttons">
						<button
							onClick={() => downloadFile(
								dictionary.spec.data,
								dictionary.name,
								'text/xml',
							)}
							className="outliner__item-button">
							<i className="outliner__item-button-icon download"></i>
						</button>
					</div>
				</div>
			))
		}
	</div>;

export default OutlinerDictionaryList;
