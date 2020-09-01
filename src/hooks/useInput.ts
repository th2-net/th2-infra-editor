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
	validate?: (value: string) => boolean;
	id?: string;
	name?: string;
}

export interface InputConfig {
	value: string;
	setValue: (value: string) => void;
	reset: () => void;
	isValid: boolean;
	isDirty: boolean;
	bind: {
		value: string;
		onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
		id?: string;
		name?: string;
	};
}

export const useInput = ({
	initialValue,
	validate,
	id,
	name,
}: UseInputProps): InputConfig => {
	const [value, setValue] = React.useState(initialValue);
	const [isValid, setIsValid] = React.useState(true);
	const [isDirty, setIsDirty] = React.useState(false);

	React.useEffect(() => {
		if (validate) {
			setIsValid(validate(value));
		}
	}, [value]);

	const onValueChange = (newValue: string) => {
		setIsDirty(true);
		setValue(newValue);
	};

	return {
		value,
		setValue: onValueChange,
		reset: () => setValue(''),
		isValid,
		isDirty,
		bind: {
			value,
			onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			  setValue(event.target.value);
			},
			id,
			name,
		},
	};
};
