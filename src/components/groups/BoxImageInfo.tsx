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

interface ImagePropProps {
	name: string;
	value: string | number;
	validationFunc: (value: string) => boolean;
	setImageProp: (propName: string, value: string) => void;
}

const ImageProp = ({
	name,
	value,
	validationFunc,
	setImageProp,
}: ImagePropProps) => {
	const [propValue, setPropsValue] = React.useState(() => (value ? value.toString() : ''));
	const [isValid, setIsValid] = React.useState(true);

	React.useEffect(() => () => {
		if (isValid) {
			setImageProp(name, propValue);
		}
	});

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (validationFunc(e.target.value)) {
			setIsValid(true);
		} else {
			setIsValid(false);
		}
		setPropsValue(e.target.value);
	};

	const onBlur = () => {
		if (isValid) {
			setImageProp(name, propValue);
		}
	};

	const inputClass = createBemElement(
		'box-settings',
		'input',
		!isValid ? 'invalid' : '',
	);

	return (
		<div
			className="box-settings__group">
			<label
				htmlFor={name}
				className="box-settings__label">
				{name}
			</label>
			<input
				id={name}
				type="text"
				className={inputClass}
				defaultValue={propValue}
				name={name}
				onChange={onChange}
				onBlur={onBlur}
			/>
		</div>
	);
};

interface BoxImageInfoProps {
	spec: {
		['image-name']: string;
		['image-version']: string;
		['node-port']?: number;
	};
	setImageInfo: (imageProp: {
		name: 'image-name' | 'image-version' | 'node-port';
		value: string;
	}, boxName: string) => void;
	boxName: string;
}

const BoxImageInfo = ({
	spec,
	setImageInfo,
	boxName,
}: BoxImageInfoProps) => {
	const config = new Map([
		['image-name', () => true],
		['image-version', (value: string) => value.split('.').every(number => /^\d+$/.test(number))],
		['node-port', (value: string) => /^\d+$/.test(value)],
	]);

	const setImageProp = (propName: string, value: string) => {
		setImageInfo({
			name: propName as 'image-name' | 'image-version' | 'node-port',
			value,
		}, boxName);
	};

	return (
		<div className="box-settings__image-info">
			{
				Object.entries(spec).map(([key, value]) => (
					<ImageProp
						key={key}
						name={key}
						value={value ?? ''}
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						validationFunc={config.get(key)!}
						setImageProp={setImageProp}
					/>
				))
			}
		</div>
	);
};

export default BoxImageInfo;
