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
import { observer } from 'mobx-react-lite';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { Pin } from '../../models/Box';
import { useInput } from '../../hooks/useInput';
import '../../styles/pin-configurator.scss';
import Input from '../util/Input';
import AttributesList from './AttributesList';
import FiltersList from './FiltersList';
import useSchemasStore from '../../hooks/useSchemasStore';

interface PinConfiguratorProps {
	pin: Pin;
	boxName: string;
	configuratePin: (pin: Pin, boxName: string) => void;
	onClose: () => void;
}

const PinConfigurator = ({
	pin,
	boxName,
	onClose,
	configuratePin,
}: PinConfiguratorProps) => {
	const schemasStore = useSchemasStore();

	const [attributes, setAttributes] = React.useState(pin.attributes);
	const [filters, setFilters] = React.useState(pin.filters);

	const editorRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(editorRef, onClose);

	const nameInput = useInput({
		initialValue: pin.name,
		label: 'Name',
		id: 'pin-name',
	});

	const connectionTypeInput = useInput({
		initialValue: pin['connection-type'],
		label: 'Name',
		id: 'pin-connection-type',
	});

	const submit = () => {
		configuratePin({
			name: nameInput.value,
			'connection-type': connectionTypeInput.value,
			attributes,
			filters,
		}, boxName);
		onClose();
	};

	return (
		<div
			ref={editorRef}
			className="pin-configurator">
			<h3 className='pin-configurator__title'>Pin configurator</h3>
			<div className="pin-configurator__parts-wrapper">
				<div className="pin-configurator__part">
					<Input inputConfig={nameInput}/>
					<Input inputConfig={connectionTypeInput}/>
					<AttributesList
						attributes={attributes}
						changeAttributesList={setAttributes}
						addAttribute={schemasStore.addAttribute}
						removeAttribute={schemasStore.removeAttribute}
						boxName={boxName}
						pinName={pin.name}
					/>
				</div>
				<div className="pin-configurator__part">
					<FiltersList
						filters={filters}
						changeFiltersList={setFilters}
						addFilter={schemasStore.addFilter}
						removeFilter={schemasStore.removeFilter}
						boxName={boxName}
						pinName={pin.name}
					/>
				</div>
			</div>
			<div className="pin-configurator__buttons">
				<button
					onClick={() => submit()}
					className="pin-configurator__button"
				>Submit</button>
				<button
					onClick={() => onClose()}
					className="pin-configurator__button"
				>Close</button>
			</div>
		</div>
	);
};

export default observer(PinConfigurator);
