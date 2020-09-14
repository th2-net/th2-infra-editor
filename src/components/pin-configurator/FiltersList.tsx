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
import { Filter } from '../../models/Box';
import { useInput } from '../../hooks/useInput';
import Input from '../util/Input';

interface PinFilterProps {
	filter: Filter;
	changeFilter: (oldValue: Filter, newValue: Filter) => void;
	removeFilter: (filter: Filter, pinName: string, boxName: string) => void;
	boxName: string;
	pinName: string;
}

const PinFilter = ({
	filter,
	changeFilter,
	removeFilter,
	boxName,
	pinName,
}: PinFilterProps) => {
	const [isEdited, setIsEdited] = React.useState(false);
	const [filedNameValue, setFiledNameValue] = React.useState('');
	const [expectedValue, setExpectedValue] = React.useState('');
	const [operation, setOperation] = React.useState('');

	const fieldNameInput = useInput({
		initialValue: filter.metadata[0]['field-name'],
		label: 'Field name',
		name: 'field-name',
		id: 'field-name',
	});

	const expectedValueInput = useInput({
		initialValue: filter.metadata[0]['expected-value'],
		label: 'Expected value',
		name: 'expected value',
		id: 'expected value',
	});

	const operationInput = useInput({
		initialValue: filter.metadata[0].operation,
		label: 'Operation',
		name: 'operation',
		id: 'operation',
	});

	const inputs = [fieldNameInput, expectedValueInput, operationInput];

	return (
		<div className="pin-configurator__filter">
			{
				!isEdited
					? (
						<>
							{
								inputs.map(inputConfig => (
									<div
										key={inputConfig.label}
										className="pin-configurator__filter-info">
										<span className="pin-configurator__filter-info-key">{inputConfig.label}</span>
										<span className="pin-configurator__filter-info-value">{inputConfig.value}</span>
									</div>
								))
							}
							<div className="pin-configurator__filter-buttons">
								<button
									onClick={() => {
										setFiledNameValue(fieldNameInput.value);
										setExpectedValue(expectedValueInput.value);
										setOperation(operationInput.value);
										setIsEdited(true);
									}}
									className="pin-configurator__filter-button">
									<i className="pin-configurator__filter-button-icon edit"/>
								</button>
								<button
									onClick={() => removeFilter(filter, pinName, boxName)}
									className="pin-configurator__filter-button">
									<i className="pin-configurator__filter-button-icon delete"/>
								</button>
							</div>
						</>
					)
					: (
						<>
							{
								inputs.map(inputConfig => (
									<Input
										key={inputConfig.label}
										inputConfig={inputConfig}
									/>
								))
							}
							<div className="pin-configurator__filter-buttons">
								<button
									onClick={() => {
										setIsEdited(false);
										changeFilter(filter, {
											metadata: [{
												'field-name': fieldNameInput.value,
												'expected-value': expectedValueInput.value,
												operation: operationInput.value,
											}],
										});
									}}
									className="pin-configurator__filter-button">
									<i className="pin-configurator__filter-button-icon submit"/>
								</button>
								<button
									onClick={() => {
										fieldNameInput.setValue(filedNameValue);
										expectedValueInput.setValue(expectedValue);
										operationInput.setValue(operation);
										setIsEdited(false);
									}}
									className="pin-configurator__filter-button">
									<i className="pin-configurator__filter-button-icon close"/>
								</button>
							</div>
						</>
					)
			}
		</div>
	);
};

interface FiltersListProps {
	filters?: Filter[];
	addFilter: (filter: Filter, pinName: string, boxName: string) => void;
	changeFiltersList: (filters: Filter[]) => void;
	removeFilter: (filter: Filter, pinName: string, boxName: string) => void;
	boxName: string;
	pinName: string;
}

const FiltersList = ({
	filters,
	addFilter,
	changeFiltersList,
	removeFilter,
	boxName,
	pinName,
}: FiltersListProps) => {
	const [isAddFilterFormOpen, setIsAddFilterFormOpen] = React.useState(false);

	const fieldNameInput = useInput({
		initialValue: '',
		label: 'Field name',
		name: 'field-name',
		id: 'field-name',
	});

	const expectedValueInput = useInput({
		initialValue: '',
		label: 'Expected value',
		name: 'expected value',
		id: 'expected value',
	});

	const operationInput = useInput({
		initialValue: '',
		label: 'Operation',
		name: 'operation',
		id: 'operation',
	});

	const inputs = [fieldNameInput, expectedValueInput, operationInput];

	const addNewFilter = () => {
		addFilter({
			metadata: [
				{
					'field-name': fieldNameInput.value,
					'expected-value': expectedValueInput.value,
					operation: operationInput.value,
				},
			],
		}, pinName, boxName);
	};

	const changeFilter = (oldValue: Filter, newValue: Filter) => {
		if (filters) {
			const filterIndex = filters.findIndex(attribute => attribute === oldValue);
			changeFiltersList([
				...filters.slice(0, filterIndex),
				newValue,
				...filters.slice(filterIndex + 1, filters.length),
			]);
		}
	};

	return (
    	<div
			className="box-settings__group">
			<span
				className="box-settings__label">
				Filters
			</span>
			<div className="pin-configurator__filters-list-wrapper">
				<div className="pin-configurator__filters-list">
					{
						filters && filters.map(filter => (
							<PinFilter
								key={JSON.stringify(filter.metadata)}
								filter={filter}
								changeFilter={changeFilter}
								removeFilter={removeFilter}
								boxName={boxName}
								pinName={pinName}
							/>
						))
					}
					{
						isAddFilterFormOpen
						&& <div className="pin-configurator__filter">
							{
								inputs.map(inputConfig => (
									<Input
										key={inputConfig.label}
										inputConfig={inputConfig}/>
								))
							}
							<div className="pin-configurator__filter-buttons">
								<button
									onClick={() => {
										addNewFilter();
										setIsAddFilterFormOpen(false);
									}}
									className="pin-configurator__filter-button">
									<i className="pin-configurator__filter-button-icon submit"/>
								</button>
								<button
									onClick={() => setIsAddFilterFormOpen(false)}
									className="pin-configurator__filter-button">
									<i className="pin-configurator__filter-button-icon close"/>
								</button>
							</div>
						</div>
					}
				</div>
				<div className="pin-configurator__buttons">
					<button
						onClick={() => setIsAddFilterFormOpen(true)}
						className="pin-configurator__button"
					>Add</button>
				</div>
			</div>
		</div>
	);
};

export default FiltersList;
