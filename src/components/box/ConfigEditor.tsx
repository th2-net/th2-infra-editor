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

interface ConfigEditor {
	config?: {[prop: string]: string};
	changeCustomConfig: (config: {[prop: string]: string}, boxName: string) => void;
	boxName: string;
}

const ConfigEditor = ({
	config,
	changeCustomConfig,
	boxName,
}: ConfigEditor) => {
	const configInput = useInput({
		initialValue: JSON.stringify(config, null, 4),
		validate: value => {
			try {
				JSON.parse(value);
				return true;
			} catch {
				return false;
			}
		},
		name: 'config',
		id: 'config',
	});

	const textAreaClass = createBemElement(
		'box-settings',
		'textarea',
		!configInput.isValid ? 'invalid' : '',
	);

	const onBlur = () => {
		if (configInput.isValid) {
			changeCustomConfig(JSON.parse(configInput.value), boxName);
		}
	};

	return (
		<div className="box-settings__group">
			<label htmlFor={configInput.bind.name} className="box-settings__label">
				Config
			</label>
			<textarea
				className={textAreaClass}
				onBlur={onBlur}
				{...configInput.bind}/>
		</div>
	);
};

export default ConfigEditor;
