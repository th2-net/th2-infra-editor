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

interface UseCheckboxProps {
	initialState: boolean;
	label: string;
	id: string;
	name: string;
}

export interface CheckboxConfig {
	isChecked: boolean;
	label: string;
	setValue: (isChecked: boolean) => void;
	isDirty: boolean;
	bind: {
		checked: boolean;
		onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
		id: string;
		name: string;
	};
}

export const useCheckbox = ({
	initialState,
	label,
	id,
	name,
}: UseCheckboxProps): CheckboxConfig => {
	const [isChecked, setIsChecked] = React.useState(initialState);
	const [isDirty, setIsDirty] = React.useState(false);

	React.useEffect(() => {
		setIsChecked(initialState);
	}, [initialState]);

	const onValueChange = (newValue: boolean) => {
		setIsDirty(true);
		setIsChecked(newValue);
	};

	return {
		isChecked,
		label,
		setValue: onValueChange,
		isDirty,
		bind: {
			checked: isChecked,
			onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
				setIsDirty(true);
				setIsChecked(event.target.checked);
			},
			id,
			name,
		},
	};
};
