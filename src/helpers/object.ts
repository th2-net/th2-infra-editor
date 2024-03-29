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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isEqual(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
	return Object.entries(obj1).every(([key, value1]) => {
		const value2 = obj2[key];

		if (value1 && value2 && typeof value1 === 'object' && typeof value2 === 'object') {
			return isEqual(value1, value2);
		}

		return value1 === value2;
	});
}

export function copyObject<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Returns typed object keys
 * @param obj
 */
export function getObjectKeys<O extends object>(obj: O) {
	return Object.keys(obj) as Array<keyof O>;
}
