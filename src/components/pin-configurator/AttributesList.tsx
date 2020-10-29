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
import { useInput } from '../../hooks/useInput';
import FormModal from '../util/FormModal';
import { ModalPortal } from '../util/Portal';

interface AttributeProps {
	attribute: string;
	changeAttribute: (oldValue: string, newValue: string) => void;
	removeAttribute: (attribute: string) => void;
}

interface AttributesListProps {
	attributes: string[];
	addAttribute: (attribute: string) => void;
	removeAttribute: (attribute: string) => void;
	changeAttributesList: (attributes: string[]) => void;
	isFormOpen: boolean;
}

const AttributesList = ({
	attributes,
	addAttribute,
	removeAttribute,
	changeAttributesList,
	isFormOpen,
}: AttributesListProps) => {
	const [isAttributeFormOpen, setIsAttributeFormOpen] = React.useState(isFormOpen);
	const [editableAttribute, setEditableAttribute] = React.useState<string | null>(null);

	React.useEffect(() => {
		setIsAttributeFormOpen(isFormOpen);
		if (isFormOpen) {
			setEditableAttribute(null);
		}
	}, [isFormOpen]);

	const attributeInput = useInput({
		initialValue: editableAttribute ?? undefined,
		id: 'attribute-name',
		label: 'Name',
	});

	const submitForm = () => {
		if (editableAttribute) {
			const attributeIndex = attributes.findIndex(attribute => attribute === editableAttribute);
			changeAttributesList([
				...attributes.slice(0, attributeIndex),
				attributeInput.value,
				...attributes.slice(attributeIndex + 1, attributes.length),
			]);
		} else {
			addAttribute(attributeInput.value);
		}
		setIsAttributeFormOpen(false);
	};

	return (
		<>
			<div className="modal__elements-list">
				{
					attributes.length > 0
						? attributes.map(attribute =>
							<div
								key={attribute}
								className="modal__elements-item">
								<span className="modal__elements-item-name">
									{attribute}
								</span>
								<div className="modal__elements-item-buttons-wrapper">
									<button
										onClick={() => {
											setEditableAttribute(attribute);
											setIsAttributeFormOpen(true);
										}}
										className="modal__elements-item-button edit">
										<i className="modal__elements-item-button-icon" />
									</button>
									<button
										onClick={() => removeAttribute(attribute)}
										className="modal__elements-item-button delete">
										<i className="modal__elements-item-button-icon" />
									</button>
								</div>
							</div>)
						: <div className="modal__empty">
							Attributes list is empty
						</div>
				}
			</div>
			{
				<ModalPortal isOpen={isAttributeFormOpen}>
					<FormModal
						title={editableAttribute ?? 'Create attribute'}
						inputConfigList={[attributeInput]}
						onSubmit={submitForm}
						onClose={() => setEditableAttribute(null)}
					/>
				</ModalPortal>
			}
		</>
	);
};

export default AttributesList;
