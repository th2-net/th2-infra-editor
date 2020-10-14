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
 *  limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { DictionaryRelation } from '../../models/Dictionary';

interface PinsListProps {
	dictionaryRelations: DictionaryRelation[];
	removeDictionaryRelation: (relation: DictionaryRelation) => void;
}

const DictionaryList = ({
	dictionaryRelations,
	removeDictionaryRelation,
}: PinsListProps) => (
	<div className="modal__elements-list">
		{
			dictionaryRelations.length > 0
				? dictionaryRelations.map(relation => (
					<div
						key={relation.name}
						className="element">
						<div className="element__header">
							<h3 className="element__title">
								{relation.name}
							</h3>
							<div className="element__buttons-wrapper">
								<button
									onClick={() => removeDictionaryRelation(relation)}
									className="element__button remove">
									<i className="element__button-icon" />
								</button>
							</div>
						</div>
						<div className="element__body">
							<div className="element__info-list">
								<div className="element__info">
									<div className="element__info-name">Dictionary name</div>
									<div className="element__info-value">{relation.dictionary.name}</div>
								</div>
								<div className="element__info">
									<div className="element__info-name">Dictionary type</div>
									<div className="element__info-value">{relation.dictionary.type}</div>
								</div>
							</div>
						</div>
					</div>
				))
				: <div className="modal__empty">
					Dictionary list is empty
				</div>
		}
	</div>
);

export default DictionaryList;
