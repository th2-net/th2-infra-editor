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

interface UseInputProps {
	initialValue: string;
	label?: string;
	id: string;
	name?: string;
	autocomplete?: {
		datalistKey: string;
		variants: string[];
	};
	validate?: (value: string) => boolean;
}

export interface InputConfig {
	value: string;
	label?: string;
	setValue: (value: string) => void;
	reset: () => void;
	isValid: boolean;
	isDirty: boolean;
	autocomplete?: {
		datalistKey: string;
		variants: string[];
	};
	bind: {
		value: string;
		onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
		id: string;
		name?: string;
	};
}

export const useInput = ({
	initialValue,
	label,
	validate,
	id,
	name,
	autocomplete,
}: UseInputProps): InputConfig => {
	const [value, setValue] = React.useState(initialValue);
	const [isValid, setIsValid] = React.useState(true);
	const [isDirty, setIsDirty] = React.useState(false);

	React.useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	React.useEffect(() => {
		if (validate) {
			if (value.length === 0) {
				setIsValid(true);
				return;
			}
			setIsValid(validate(value));
		}
	}, [value]);

	const onValueChange = (newValue: string) => {
		setIsDirty(true);
		setValue(newValue);
	};

	return {
		value,
		label,
		setValue: onValueChange,
		reset: () => setValue(''),
		isValid,
		isDirty,
		autocomplete,
		bind: {
			value,
			onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
				setIsDirty(true);
				setValue(event.target.value);
			},
			id,
			name,
		},
	};
};
