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
import { useInput } from '../../hooks/useInput';
import Input from '../util/Input';

interface BoxImageInfoProps {
	spec: {
		imageName: string;
		imageVersion: string;
		nodePort: string;
	};
	setImageName: (imageName: { value: string; isValid: boolean }) => void;
	setImageVersion: (imageVersion: { value: string; isValid: boolean }) => void;
	setNodePort: (nodePort: { value: string; isValid: boolean }) => void;
}

const BoxImageInfo = ({ spec, setImageName, setImageVersion, setNodePort }: BoxImageInfoProps) => {
	const imageNameInput = useInput({
		initialValue: spec.imageName,
		label: 'image-name',
		name: 'image-name',
		id: 'image-name',
	});

	const imageVersionInput = useInput({
		initialValue: spec.imageVersion,
		label: 'image-version',
		name: 'image-version',
		id: 'image-version',
	});

	const nodePortInput = useInput({
		initialValue: spec.nodePort,
		label: 'node-port',
		name: 'node-port',
		id: 'node-port',
		validate: value => /^\d+$/.test(value),
	});

	React.useEffect(() => {
		if (imageNameInput.isDirty) {
			setImageName({
				value: imageNameInput.value,
				isValid: imageNameInput.isValid,
			});
		}
	}, [imageNameInput.value]);

	React.useEffect(() => {
		if (imageVersionInput.isDirty) {
			setImageVersion({
				value: imageVersionInput.value,
				isValid: imageVersionInput.isValid,
			});
		}
	}, [imageVersionInput.value]);

	React.useEffect(() => {
		if (nodePortInput.isDirty) {
			setNodePort({
				value: nodePortInput.value,
				isValid: nodePortInput.isValid,
			});
		}
	}, [nodePortInput.value]);

	return (
		<div className='box-settings__image-info'>
			{[imageNameInput, imageVersionInput, nodePortInput].map(inputConfig => (
				<Input key={inputConfig.bind.id} inputConfig={inputConfig} />
			))}
		</div>
	);
};

export default BoxImageInfo;
