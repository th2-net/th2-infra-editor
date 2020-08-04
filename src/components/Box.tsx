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
import { createBemElement, createStyleSelector } from '../helpers/styleCreators';
import { BoxEntity } from '../models/Box';
import { useRootStore } from '../hooks/useRootStore';
import { intersection } from '../helpers/array';
import '../styles/box.scss';

interface Props {
	box: BoxEntity;
}

const Box = ({ box }: Props) => {
	const store = useRootStore();
	const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
	const rootClassName = createStyleSelector(
		'box',
		store.activeLink?.includes(box.metadata.name) ? 'active' : null,
	);

	const settingsIconClassName = createBemElement(
		'box',
		'settings-icon',
		isSettingsOpen ? 'active' : null,
	);

	const headerClassname = createBemElement(
		'box',
		'header',
		isSettingsOpen ? 'active' : null,
	);

	return (
		<div
			className={rootClassName}
			onMouseEnter={() => store.setActiveBox(box)}
			onMouseLeave={() => store.setActiveBox(null)}>
			<div className={headerClassname}>
				<span className="box__title">
					{box.metadata.name}
				</span>
				<button className="box__settings-button"
					onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
					<i className={settingsIconClassName}/>
				</button>
			</div>
			<div
				className="box-settings__wrapper"
				style={{
					maxHeight: isSettingsOpen ? '500px' : 0,
				}}>
				<div className="box-settings">
					{
						box.spec.params.map(param => (
							<div className="box-settings__group" key={param.name}>
								<label htmlFor="" className="box-settings__label">
									{param.name}
								</label>
								<input
									type="text"
									className="box-settings__input"
									value={param.value.toString()}/>
							</div>
						))
					}
					<div className="box-settings__buttons">
						<button className="box-settings__button">
							Cancel
						</button>
						<button className="box-settings__button">
							Apply Settings
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default observer(Box);
