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
import { BoxEntity, DictionaryRelation } from '../../models/Box';
import BoxImageInfo from './BoxImageInfo';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import BoxDictionaryConfigurator from './BoxDictionaryConfigurator';
import ConfigEditor from './ConfigEditor';

interface BoxSettingsProps {
	box: BoxEntity;
	onParamValueChange: (boxName: string, paramName: string, value: string) => void;
	onClose: () => void;
	addDictionaryRelation: (dictionaryRelation: DictionaryRelation) => void;
	changeCustomConfig: (config: {[prop: string]: string}, boxName: string) => void;
	deleteParam: (paramName: string, boxName: string) => void;
	setImageInfo: (imageProp: {
		name: 'image-name' | 'image-version' | 'node-port';
		value: string;
	}, boxName: string) => void;
}

const BoxSettings = ({
	box,
	onParamValueChange,
	onClose,
	addDictionaryRelation,
	changeCustomConfig,
	deleteParam,
	setImageInfo,
}: BoxSettingsProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const [showDictionaryConfigurator, isShowAddForm] = React.useState(false);

	const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		onParamValueChange(box.name, e.target.name, e.target.value);
	};

	useOutsideClickListener(modalRef, () => {
		onClose();
	});

	return (
		<div ref={modalRef} className="box-modal">
			<h3 className="box-modal__name">
				{box.name}
			</h3>
			<div className="box-modal__box-settings">
				<div className="box-modal__image-info">
					<BoxImageInfo
						setImageInfo={setImageInfo}
						spec={{
							'image-name': box.spec['image-name'],
							'image-version': box.spec['image-version'],
							'node-port': box.spec['node-port'],
						}}
						boxName={box.name}
					/>
					<ConfigEditor
						config={box.spec['custom-config']}
						changeCustomConfig={changeCustomConfig}
						boxName={box.name}
					/>
				</div>
				<div className="box-modal__props-list">
					{
						box.spec.params
						&& box.spec.params.map(param => (
							<div className="box-settings__group" key={param.name}>
								<div className="box-modal__wrapper">
									<label htmlFor={param.name} className="box-settings__label">
										{param.name}
									</label>
									<button
										onClick={() => deleteParam(param.name, box.name)}
										className="box-modal__delete-button" />
								</div>
								<input
									id={param.name}
									type="text"
									className="box-settings__input"
									defaultValue={param.value.toString()}
									onBlur={onBlur}
									name={param.name}/>
							</div>
						))
					}
					{
						showDictionaryConfigurator
						&& <BoxDictionaryConfigurator
							addDictionaryRelation={addDictionaryRelation}
							boxName={box.name}
							closeAddForm={() => isShowAddForm(false)}/>
					}
				</div>
			</div>
			<div className="box-modal__buttons">
				{
					!showDictionaryConfigurator
					&& <button className="box-modal__button" onClick={() => isShowAddForm(true)}>
						Add Dictionary
					</button>
				}
				<button onClick={onClose} className="box-modal__button">
					Close
				</button>
			</div>
		</div>
	);
};

export default BoxSettings;
