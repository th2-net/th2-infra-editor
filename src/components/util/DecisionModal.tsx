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

interface DecisionModalProps {
	text: string;
	mainVariant: {
		title: string;
		func: () => void;
	};
	variants: {
		title: string;
		func: () => void;
	}[];
	onClose: () => void;
}

const DecisionModal = ({
	text,
	mainVariant,
	variants,
	onClose,
}: DecisionModalProps) => {
	const timeout = React.useRef<NodeJS.Timeout>();

	React.useEffect(() => {
		timeout.current = setTimeout(() => {
			mainVariant.func();
			onClose();
		}, 15000);
	}, []);

	const makeDecision = (func: () => void) => {
		if (timeout.current) {
			clearTimeout(timeout.current);
		}
		func();
	};

	return (<div className="modal decision__modal">
		<div className="modal__content">
			<p className="modal__paragraph">
				{text}
			</p>
		</div>
		<div className="modal__buttons center">
			{
				[mainVariant, ...variants].map((variant, index) => (
					<button
						key={index}
						onClick={() => makeDecision(variant.func)}
						className="modal__button">
						{variant.title}
					</button>
				))
			}
		</div>
	</div>);
};

export default DecisionModal;
