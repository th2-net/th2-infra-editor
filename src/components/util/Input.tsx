/* eslint-disable no-alert */
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
import { InputConfig } from '../../hooks/useInput';
import { createBemBlock } from '../../helpers/styleCreators';

interface InputProps {
	inputConfig: InputConfig;
}

const Input = ({ inputConfig }: InputProps) => {
	const inputClass = createBemBlock(
		'input',
		!inputConfig.isValid && inputConfig.isDirty ? 'invalid' : '',
	);

	return (
		<div className='input-wrapper'>
			<label htmlFor={inputConfig.bind.id} className='input-label'>
				{inputConfig.label}
			</label>
			<input
				{...inputConfig.bind}
				type='text'
				className={inputClass}
				list={inputConfig.autocomplete?.datalistKey}
				autoComplete='off'
			/>
			{inputConfig.autocomplete && inputConfig.value.length > 0 && (
				<datalist id={inputConfig.autocomplete.datalistKey}>
					{inputConfig.autocomplete.variants.map((variant, index) => (
						<option key={index} value={variant} />
					))}
				</datalist>
			)}
		</div>
	);
};
export default Input;
