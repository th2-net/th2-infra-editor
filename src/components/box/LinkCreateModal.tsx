import React from 'react';
import { createLink } from '../../helpers/link';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import { useInput } from '../../hooks/useInput';
import useSchemasStore from '../../hooks/useSchemasStore';
import { ExtendedConnectionOwner } from '../../models/Box';
import FormModal from '../util/FormModal';

interface LinkCreateModalProps {
	defaultName: string;
	from: ExtendedConnectionOwner;
	to: ExtendedConnectionOwner;
	extended: boolean;
	close: () => void;
}

const LinkCreateModal = ({ defaultName, from, to, extended, close }: LinkCreateModalProps) => {
	const connectionsStore = useConnectionsStore();
	const schemasStore = useSchemasStore();

	const linkNameInput = useInput({
		initialValue: defaultName,
		id: 'link-name',
		label: 'name',
		validate: linkName => !connectionsStore.links.find(link => link.name === linkName),
	});

	const linkFromStrategyInput = useInput({
		initialValue: '',
		id: 'from-link-strategy',
		label: 'from-strategy',
	});

	const linkToStrategyInput = useInput({
		initialValue: '',
		id: 'to-link-strategy',
		label: 'to-strategy',
	});

	const linkToServiceClassInput = useInput({
		initialValue: '',
		id: 'link-service-class',
		label: 'service-class',
	});

	const onSubmit = () => {
		if (!schemasStore.activeBox || !schemasStore.activePin) return;

		const fromPosition = from;
		const toPosition = to;

		if (extended) {
			fromPosition.strategy = linkFromStrategyInput.value;
			toPosition.strategy = linkToStrategyInput.value;
			toPosition['service-class'] = linkToServiceClassInput.value;
		}

		const link = createLink(linkNameInput.value, fromPosition, toPosition);
		connectionsStore.addLink(link);
		schemasStore.setActiveBox(null);
		schemasStore.setActivePin(null);
		inputs.forEach(input => input.reset());
	};

	const inputs = [
		linkNameInput,
		...(extended ? [linkFromStrategyInput, linkToStrategyInput, linkToServiceClassInput] : []),
	];

	return (
		<FormModal
			title={'Create link'}
			inputConfigList={inputs}
			onSubmit={() => {
				onSubmit();
				close();
			}}
			onClose={close}
		/>
	);
};

export default LinkCreateModal;
