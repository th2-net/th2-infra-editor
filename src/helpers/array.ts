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
 * limitations under the License.
 ***************************************************************************** */

export function intersection<T>(arr1: T[], arr2: T[]): T[] {
	return arr1.filter(item => arr2.includes(item));
}

export function rightJoin<T>(arr1: T[], arr2: T[]): T[] {
	const array = new Array<T>();
	arr2.forEach(item => {
		if (!arr1.includes(item)) {
			array.push(item);
		}
	});
	return array;
}

export function sortByKey<T, K extends keyof T>(arr: T[], key: K): T[] {
	const copy = arr.slice();
	copy.sort((a, b) => (a[key] > b[key] ? 1 : -1));
	return copy;
}

export function sortBy<T>(
	arr: T[],
	sortValueGetter: (item: T) => string | number,
	sortDirection: 'asc' | 'desc' = 'asc',
) {
	const arrCopy = arr.slice();
	arrCopy.sort((a, b) =>
		sortValueGetter(a) > sortValueGetter(b)
			? sortDirection === 'asc'
				? -1
				: 1
			: sortValueGetter(a) < sortValueGetter(b)
			? sortDirection === 'asc'
				? 1
				: -1
			: 0,
	);

	return arrCopy;
}
