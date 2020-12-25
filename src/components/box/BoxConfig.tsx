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
import { CheckboxConfig } from '../../hooks/useCheckbox';
import { InputConfig } from '../../hooks/useInput';
import Checkbox from '../util/Checkbox';
import Input from '../util/Input';
import ConfigEditor from './ConfigEditor';

interface BoxConfigProps {
	imageNameInputConfig: InputConfig;
	imageVersionInputConfig: InputConfig;
	nodePortInputConfig: InputConfig;
	boxConfigInput: InputConfig;
	serviceEnabledCheckbox: CheckboxConfig;
}

const BoxConfig = ({
	imageNameInputConfig,
	imageVersionInputConfig,
	nodePortInputConfig,
	boxConfigInput,
	serviceEnabledCheckbox,
}: BoxConfigProps) => (
	<>
		{[imageNameInputConfig, imageVersionInputConfig, nodePortInputConfig].map(config => (
			<Input key={config.bind.id} inputConfig={config} />
		))}
		<Checkbox checkboxConfig={serviceEnabledCheckbox} />
		<ConfigEditor configInput={boxConfigInput} />
	</>
);

export default BoxConfig;
