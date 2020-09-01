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
import { createBemElement } from '../../helpers/styleCreators';
import { useInput } from '../../hooks/useInput';

interface BoxImageInfoProps {
	spec: {
		['image-name']: string;
		['image-version']: string;
		['node-port']?: number;
	};
	setImageInfo: (imageProp: {
		name: 'image-name' | 'image-version' | 'node-port';
		value: string;
	}, boxName: string) => void;
	boxName: string;
}

const BoxImageInfo = ({
	spec,
	setImageInfo,
	boxName,
}: BoxImageInfoProps) => {
	const imageNameInput = useInput({
		initialValue: spec['image-name'],
		name: 'image-name',
		id: 'image-name',
	});

	const imageVersionInput = useInput({
		initialValue: spec['image-version'],
		validate: value => value.split('.').every(number => /^\d+$/.test(number)),
		name: 'image-version',
		id: 'image-version',
	});

	const nodePortInput = useInput({
		initialValue: typeof spec['node-port'] === 'number' ? spec['node-port'].toString() : '',
		validate: value => /^\d+$/.test(value),
		name: 'node-port',
		id: 'node-port',
	});

	React.useEffect(() => {
		[imageNameInput, imageVersionInput, nodePortInput]
			.filter(input => input.isValid)
			.forEach(input => {
				setImageInfo({
					name: input.bind.name as 'image-name' | 'image-version' | 'node-port',
					value: input.value,
				}, boxName);
			});
	}, [imageNameInput, imageVersionInput, nodePortInput]);

	return (
		<div className="box-settings__image-info">
			{
				[imageNameInput, imageVersionInput, nodePortInput]
					.map(inputConfig => (
						<div key={inputConfig.bind.id} className="box-settings__group">
							<label htmlFor={inputConfig.bind.id} className="box-settings__label">
								{inputConfig.bind.name}
							</label>
							<input
								type="text"
								className={createBemElement(
									'box-settings',
									'input',
									!inputConfig.isValid && inputConfig.isDirty ? 'invalid' : '',
								)}
								{...inputConfig.bind}
							/>
						</div>
					))
			}
		</div>
	);
};

export default BoxImageInfo;
