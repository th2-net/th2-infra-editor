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
import { InputConfig } from '../../hooks/useInput';
import Input from '../util/Input';
import JSONEditor from '../util/JSONEditor';

interface BoxConfigProps {
	boxNameInputConfig: InputConfig;
	imageNameInputConfig: InputConfig;
	imageVersionInputConfig: InputConfig;
	nodePortInputConfig: InputConfig;
	boxConfigInputConfig: InputConfig;
	extendedSettingsInputConfig: InputConfig;
}

const BoxConfig = ({
	boxConfigInputConfig,
	extendedSettingsInputConfig,
	...inputConfigs
}: BoxConfigProps) => (
	<div
		className='modal__elements-list'
		style={{
			maxHeight: 600,
		}}>
		{Object.entries(inputConfigs).map(([key, config]) => (
			<Input key={key} inputConfig={config} />
		))}
		<JSONEditor inputConfig={boxConfigInputConfig} />
		<JSONEditor inputConfig={extendedSettingsInputConfig} />
	</div>
);

export default BoxConfig;
