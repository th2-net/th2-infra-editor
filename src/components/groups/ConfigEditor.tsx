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
	const [value, setValue] = React.useState(() => JSON.stringify(config, null, 4));
	const [isValid, setIsValid] = React.useState(true);

	const textAreaClass = createBemElement(
		'box-settings',
		'textarea',
		!isValid ? 'invalid' : '',
	);

	const validateValue = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setIsValid(true);
		try {
			JSON.parse(e.target.value);
		} catch {
			setIsValid(false);
		}
		setValue(e.target.value);
	};

	const onBlur = () => {
		if (isValid) {
			changeCustomConfig(
				JSON.parse(value),
				boxName,
			);
		}
	};

	return (
		<div className="box-settings__group">
			<label
				htmlFor="config"
				className="box-settings__label">
				Config
			</label>
			<textarea
				id="config"
				value={value}
				onChange={validateValue}
				className={textAreaClass}
				onBlur={onBlur}
				name="config"/>
		</div>);
};

export default ConfigEditor;
