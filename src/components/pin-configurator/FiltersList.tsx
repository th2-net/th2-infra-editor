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
import { Filter } from '../../models/Box';
import { useInput } from '../../hooks/useInput';
import { ModalPortal } from '../util/Portal';
import FormModal from '../util/FormModal';

interface FiltersListProps {
	filters?: Filter[];
	addFilter: (filter: Filter) => void;
	removeFilter: (filter: Filter) => void;
	changeFiltersList: (filters: Filter[]) => void;
	isFormOpen: boolean;
	toggleAddForm: (isOpen: boolean) => void;
}

const FiltersList = ({
	filters,
	addFilter,
	removeFilter,
	changeFiltersList,
	isFormOpen,
	toggleAddForm,
}: FiltersListProps) => {
	const [editableFilter, setEditableFilter] = React.useState<Filter | null>(null);

	const fieldNameInput = useInput({
		initialValue: editableFilter?.metadata[0]['field-name'],
		label: 'Field name',
		name: 'field-name',
		id: 'field-name',
	});

	const expectedValueInput = useInput({
		initialValue: editableFilter?.metadata[0]['expected-value'],
		label: 'Expected value',
		name: 'expected value',
		id: 'expected value',
	});

	const operationInput = useInput({
		initialValue: editableFilter?.metadata[0].operation,
		label: 'Operation',
		name: 'operation',
		id: 'operation',
	});

	const inputs = [fieldNameInput, expectedValueInput, operationInput];

	const submitForm = () => {
		if (editableFilter && filters) {
			const filterIndex = filters?.findIndex(filter => filter === editableFilter);

			changeFiltersList([
				...filters?.slice(0, filterIndex),
				{
					metadata: [
						{
							'field-name': fieldNameInput.value,
							'expected-value': expectedValueInput.value,
							operation: operationInput.value,
						},
					],
				},
				...filters?.slice(filterIndex + 1, filters.length),
			]);
		} else {
			addFilter({
				metadata: [
					{
						'field-name': fieldNameInput.value,
						'expected-value': expectedValueInput.value,
						operation: operationInput.value,
					},
				],
			});
		}
		fieldNameInput.reset();
		expectedValueInput.reset();
		operationInput.reset();
	};

	return (
		<div className='modal__elements-list'>
			{filters && filters?.length > 0 ? (
				filters.map(filter => (
					<div
						key={`
									${filter.metadata[0]['field-name']}
									${filter.metadata[0]['expected-value']}
									${filter.metadata[0].operation}
								`}
						className='modal__elements-item'>
						<div className='modal__elements-item-info'>
							<span className='modal__elements-item-info-name'>
								{filter.metadata[0]['field-name']}
							</span>
						</div>
						<div className='modal__elements-item-buttons-wrapper'>
							<button
								onClick={() => {
									setEditableFilter(filter);
									toggleAddForm(true);
								}}
								className='modal__elements-item-button edit'>
								<i className='modal__elements-item-button-icon' />
							</button>
							<button
								onClick={() => removeFilter(filter)}
								className='modal__elements-item-button delete'>
								<i className='modal__elements-item-button-icon' />
							</button>
						</div>
					</div>
				))
			) : (
				<div className='modal__empty'>Filters list is empty</div>
			)}
			<ModalPortal isOpen={isFormOpen}>
				<FormModal
					title={editableFilter ? 'Edit filter' : 'Create filter'}
					configList={inputs}
					onSubmit={submitForm}
					onClose={() => toggleAddForm(false)}
				/>
			</ModalPortal>
		</div>
	);
};

export default FiltersList;
