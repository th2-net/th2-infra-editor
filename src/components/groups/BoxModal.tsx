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
import { BoxEntity } from '../../models/Box';
import BoxImageInfo from './BoxImageInfo';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import BoxAddForm from './BoxAddForm';
import ConfigEditor from './ConfigEditor';

interface BoxModalProps {
	box: BoxEntity;
	onParamValueChange: (boxName: string, paramName: string, value: string) => void;
	onClose: () => void;
	addNewProp: (prop: {
		name: string;
		value: string;
	}, boxName: string) => void;
	changeCustomConfig: (config: {[prop: string]: string}, boxName: string) => void;
	deleteParam: (paramName: string, boxName: string) => void;
}

const BoxModal = ({
	box,
	onParamValueChange,
	onClose,
	addNewProp,
	changeCustomConfig,
	deleteParam,
}: BoxModalProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const [showAddForm, isShowAddForm] = React.useState(false);

	const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		onParamValueChange(box.name, e.target.name, e.target.value);
	};

	useOutsideClickListener(modalRef, () => {
		onClose();
	});

	return (
		<div
			ref={modalRef}
			className="box-modal">
			<h3 className="box-modal__name">{box.name}</h3>
			<div className="box-modal__box-settings">
				<div className="box-modal__image-info">
					<BoxImageInfo spec={{
						'image-name': box.spec['image-name'],
						'image-version': box.spec['image-version'],
						'node-port': box.spec['node-port'],
					}} />
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
									<label
										htmlFor={param.name}
										className="box-settings__label">
										{param.name}
									</label>
									<button
										onClick={() => deleteParam(param.name, box.name)}
										className="box-modal__delete-button"></button>
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
						showAddForm
						&& <BoxAddForm
							addNewProp={addNewProp}
							boxName={box.name}
							isFirstElement={box.spec.params.length === 0}
							closeAddForm={() => isShowAddForm(false)}/>
					}
				</div>
			</div>
			<div className="box-modal__buttons">
				{
					!showAddForm
					&& <button
						className="box-modal__button"
						onClick={() => isShowAddForm(true)}>Add Props</button>
				}
				<button
					onClick={() => onClose()}
					className="box-modal__button">Close</button>
			</div>
		</div>
	);
};

export default BoxModal;
