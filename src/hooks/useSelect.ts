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

interface UseSelectProps {
	variants: Array<string>;
	defaultValue?: string | undefined;
	label?: string;
	id: string;
	name?: string;
}

export interface SelectConfig {
	value: string | undefined;
	variants: Array<string>;
	label?: string;
	setValue: (value: string) => void;
	isDirty: boolean;
	bind: {
		value: string | undefined;
		onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
		id: string;
		name?: string;
	};
}

export const useSelect = ({
	variants,
	defaultValue,
	label,
	id,
	name,
}: UseSelectProps): SelectConfig => {
	const [value, setValue] = React.useState<string>(defaultValue || variants[0]);
	const [isDirty, setIsDirty] = React.useState(false);

	React.useEffect(() => {
		setValue(defaultValue || variants[0]);
	}, [defaultValue]);

	const onValueChange = (newValue: string) => {
		setIsDirty(true);
		setValue(newValue);
	};

	return {
		value,
		variants,
		label,
		setValue: onValueChange,
		isDirty,
		bind: {
			value,
			onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
				onValueChange(event.target.value),
			id,
			name,
		},
	};
};
