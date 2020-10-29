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

import React, { Fragment } from 'react';
import { detailedDiff, diff } from 'deep-object-diff';
import { Change, DetailedDiff, Snapshot } from '../../models/History';
import { BoxEntity, isBoxEntity } from '../../models/Box';
import { DictionaryLinksEntity, isDictionaryLinksEntity } from '../../models/Dictionary';
import { createBemBlock } from '../../helpers/styleCreators';
import { isLink } from '../../models/LinksDefinition';
import { getSnapshotTitle } from '../../helpers/snapshot';

interface ChangeLogBoxItemProps {
	snapshot: Snapshot;
}

const ChangeLogBoxItem = ({ snapshot }: ChangeLogBoxItemProps) => {
	const getEntityChanges = (change: Change) => {
		if (change.from && change.to && isBoxEntity(change.from) && isBoxEntity(change.to)) {
			const from = {
				spec: {
					'image-name': change.from.spec['image-name'],
					'image-version': change.from.spec['image-version'],
					'node-port': change.from.spec['node-port'],
				},
			};
			const to = {
				spec: {
					'image-name': change.to.spec['image-name'],
					'image-version': change.to.spec['image-version'],
					'node-port': change.to.spec['node-port'],
				},
			};

			let delta = diff(to, from);

			if (Object.entries(delta).length) {
				const changes: {
					key: string;
					change: {
						from: string | null;
						to: string | null;
					};
				}[] = Object.entries((delta as BoxEntity).spec).map(([key, value]) => ({
					key,
					change: {
						from: value as string,
						to: null,
					},
				}));
				delta = diff(from, to);
				Object.values((delta as BoxEntity).spec).forEach((value, index) => {
					changes[index].change.to = value as string;
				});

				return changes;
			}
		}
		return [];
	};

	const getPinsChanges = (change: Change) => {
		if (change.from && change.to && isBoxEntity(change.from) && isBoxEntity(change.to)) {
			const delta = detailedDiff(change.from, change.to) as DetailedDiff;
			if (
				(delta.added && delta.added.spec && (delta.added as BoxEntity).spec.pins)
				|| (delta.deleted && delta.deleted.spec && (delta.deleted as BoxEntity).spec.pins)
				|| (delta.updated && delta.updated.spec && (delta.updated as BoxEntity).spec.pins)
			) {
				return {
					added:
						(delta.added as BoxEntity).spec && (delta.added as BoxEntity).spec.pins
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							? Object.entries((delta.added as BoxEntity).spec.pins!).length
							: 0,
					deleted:
						(delta.deleted as BoxEntity).spec && (delta.deleted as BoxEntity).spec.pins
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							? Object.entries((delta.deleted as BoxEntity).spec.pins!).length
							: 0,
					updated:
						(delta.updated as BoxEntity).spec && (delta.updated as BoxEntity).spec.pins
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							? Object.entries((delta.updated as BoxEntity).spec.pins!).length
							: 0,
				};
			}
		}
		return null;
	};

	const getDictionaryChanges = (change: Change) => {
		if (change.from && change.to && isDictionaryLinksEntity(change.from) && isDictionaryLinksEntity(change.to)) {
			const delta = detailedDiff(change.from, change.to) as DetailedDiff;

			if (
				(delta.added || delta.deleted)
				&& (delta.added.spec || delta.deleted.spec)
				&& ((delta.added as DictionaryLinksEntity).spec['dictionaries-relation']
					|| (delta.added as DictionaryLinksEntity).spec['dictionaries-relation'])
			) {
				return {
					added:
						(delta.added as DictionaryLinksEntity).spec && (delta.added as DictionaryLinksEntity)
							.spec['dictionaries-relation']
							? Object.entries((delta.added as DictionaryLinksEntity)
								.spec['dictionaries-relation']).length
							: 0,
					deleted:
						(delta.deleted as DictionaryLinksEntity).spec && (delta.deleted as DictionaryLinksEntity)
							.spec['dictionaries-relation']
							? Object.entries((delta.deleted as DictionaryLinksEntity)
								.spec['dictionaries-relation']).length
							: 0,
				};
			}
		}
		return null;
	};

	const elementClass = createBemBlock(
		'element',
		(snapshot.changeList.length === 1 && snapshot.operation !== 'change')
			? 'empty' : null,
	);

	return (
		<div className={elementClass}>
			<div className="element__header">
				<i className="element__header-icon boxes" />
				<span className="element__title">{getSnapshotTitle(snapshot)}</span>
			</div>
			{
				!(snapshot.changeList.length === 1 && snapshot.operation !== 'change')
				&& <div className="element__body">
					<div className="element__info-list">
						{snapshot.changeList.map(change =>
							getEntityChanges(change).map((info, index) => (
								<div key={index} className="element__info">
									<div className="element__info-name">{info.key}</div>
									<div className="element__info-value from">{info.change.from}</div>
									<svg className="element__info-arrow" xmlns="http://www.w3.org/2000/svg">
										<line x1="0" y1="3" x2="15" y2="3" />
										<polygon points="15,3 12,6 12,0" />
									</svg>
									<div className="element__info-value to">{info.change.to}</div>
								</div>
							)))}
						{snapshot.changeList.map((change, index) => {
							const pinsChanges = getPinsChanges(change);
							return (
								pinsChanges && (
									<Fragment key={index}>
										<div className="element__info-name">Pins</div>
										{pinsChanges.added > 0 && (
											<div className="element__info-value to sub">
												{`${pinsChanges.added} added`}
											</div>
										)}
										{pinsChanges.deleted > 0 && (
											<div className="element__info-value from sub">
												{`${pinsChanges.deleted} deleted`}
											</div>
										)}
										{pinsChanges.updated > 0 && (
											<div className="element__info-value to sub">
												{`${pinsChanges.updated} updated`}
											</div>
										)}
									</Fragment>
								)
							);
						})}
						{snapshot.changeList.map((change, index) => {
							const pinsChanges = getDictionaryChanges(change);
							return (
								pinsChanges && (
									<Fragment key={index}>
										<div className="element__info-name">Dictionaries</div>
										{pinsChanges.added > 0 && (
											<div className="element__info-value to sub">
												{`${pinsChanges.added} added`}
											</div>
										)}
										{pinsChanges.deleted > 0 && (
											<div className="element__info-value from sub">
												{`${pinsChanges.deleted} deleted`}
											</div>
										)}
									</Fragment>
								)
							);
						})}
						{
							snapshot.changeList.some(change => isLink(change.from) || isLink(change.to))
								&& <div className="element__info-value from">
									All connected links were deleted
								</div>
						}
					</div>
				</div>
			}
		</div>
	);
};

export default ChangeLogBoxItem;
