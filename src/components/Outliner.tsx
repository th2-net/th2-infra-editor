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
import { observer } from 'mobx-react-lite';
import '../styles/outliner.scss';
import useStore from '../hooks/useStore';
import { ModalPortal } from './util/Portal';
import BoxSettings from './box/BoxSettings';
import { BoxEntity } from '../models/Box';

const Outliner = () => {
	const { rootStore } = useStore();

	const [editableBox, setEditableBox] = React.useState<BoxEntity>({} as BoxEntity);
	const [isBoxCreateModalOpen, setIsBoxCreateModalOpen] = React.useState(false);

	return (
		<>
			{
				rootStore.boxes.length > 0
					? <div className="outliner">
						<div className="outliner__list">
							{
								rootStore.boxes.map(box => (
									<div
										key={`${box.name}-${box.kind}`}
										onMouseOver={() => rootStore.setActiveBox(box)}
										onMouseLeave={() => rootStore.setActiveBox(null)}
										className="outliner__list-item">
										<div className="outliner__item-info">
											<span className="outliner__info-key">Kind:</span>
											<span className="outliner__info-value">{box.kind}</span>
										</div>
										<div className="outliner__item-info">
											<span className="outliner__info-key">Name:</span>
											<span className="outliner__info-value">{box.name}</span>
										</div>
										<div className="outliner__item-control-buttons">
											<button
												onClick={() => {
													setEditableBox(box);
													setIsBoxCreateModalOpen(true);
												}}
												className="outliner__item-button">
												<i className="outliner__item-button-icon edit"></i>
											</button>
											<button
												onClick={() => {
													// eslint-disable-next-line no-alert
													if (window
														.confirm('Are you sure you want'
														+ `to delete resourse "${box.name}"`)) {
														rootStore.deleteBox(box.name);
													}
												}}
												className="outliner__item-button">
												<i className="outliner__item-button-icon delete"></i>
											</button>
										</div>
									</div>
								))
							}
						</div>
						<div className="outliner__list">
							{
								rootStore.links.map(link => (
									<div
										key={`${link.name}-${link.from.box}-${link.to.box}`}
										onMouseOver={() => rootStore.setSelectedLink(link.name)}
										onMouseLeave={() => rootStore.setSelectedLink(null)}
										className="outliner__list-item">
										<div className="outliner__item-info">
											<span className="outliner__info-key">Name:</span>
											<span className="outliner__info-value">{link.name}</span>
										</div>
										<div className="outliner__item-info">
											<span className="outliner__info-key">Connection type:</span>
											<span className="outliner__info-value">{link.from.connectionType}</span>
										</div>
										<div className="outliner__item-info">
											<span className="outliner__info-key">From</span>
											<div className="outliner__item-subinfo">
												<span className="outliner__info-key">Box:</span>
												<span className="outliner__info-value">{link.from.box}</span>
											</div>
											<div className="outliner__item-subinfo">
												<span className="outliner__info-key">Pin:</span>
												<span className="outliner__info-value">{link.from.pin}</span>
											</div>
										</div>
										<div className="outliner__item-info">
											<span className="outliner__info-key">To</span>
											<div className="outliner__item-subinfo">
												<span className="outliner__info-key">Box:</span>
												<span className="outliner__info-value">{link.to.box}</span>
											</div>
											<div className="outliner__item-subinfo">
												<span className="outliner__info-key">Pin:</span>
												<span className="outliner__info-value">{link.to.pin}</span>
											</div>
										</div>
										<div className="outliner__item-control-buttons">
											{/* <button className="outliner__item-button">
												<i className="outliner__item-button-icon edit"></i>
											</button> */}
											<button
												onClick={() => {
													// eslint-disable-next-line no-alert
													if (window.confirm('Are you sure you want'
													+ `to delete link ${link.name}`)) {
														rootStore.deleteConnection(link);
													}
												}}
												className="outliner__item-button">
												<i className="outliner__item-button-icon delete"></i>
											</button>
										</div>
									</div>
								))
							}
						</div>
					</div>
					: <></>
			}
			<ModalPortal isOpen={isBoxCreateModalOpen}>
				<BoxSettings
					box={editableBox}
					onParamValueChange={rootStore.setBoxParamValue}
					onClose={() => setIsBoxCreateModalOpen(false)}
					addDictionaryRelation={rootStore.addDictionaryRelation}
					changeCustomConfig={rootStore.changeCustomConfig}
					deleteParam={rootStore.deleteParam}
					setImageInfo={rootStore.setImageInfo}
					addPinToBox={rootStore.addPinToBox}
					removePinFromBox={rootStore.removePinFromBox}
				/>
			</ModalPortal>
		</>
	);
};

export default observer(Outliner);
