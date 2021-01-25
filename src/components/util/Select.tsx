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
import { SelectConfig } from '../../hooks/useSelect';

interface SelectProps {
	selectConfig: SelectConfig;
}

const Select = ({ selectConfig }: SelectProps) => {
	return (
		<div className='select-wrapper'>
			<label htmlFor={selectConfig.bind.id} className='select-label'>
				{selectConfig.label}
			</label>
			<select {...selectConfig.bind} className='select'>
				{selectConfig.variants.map(variant => (
					<option key={variant} value={variant}>
						{variant}
					</option>
				))}
			</select>
		</div>
	);
};
export default Select;
