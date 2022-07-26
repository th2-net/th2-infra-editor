import React from 'react';
import { ToastContainerProps } from 'react-toast-notifications';
import { createBemElement } from '../../helpers/styleCreators';
import { useNotificationsStore } from '../../hooks/useNotificationsStore';
import '../../styles/toasts.scss';

function ToastContainer(props: ToastContainerProps) {
	const { hasToasts, children } = props;

	const notificationsStore = useNotificationsStore();

	const closeAllButtonClassname = createBemElement('toast-container', 'close-all');

	if (!hasToasts) return null;

	return (
		<div className='toast-container'>
			<div
				className={closeAllButtonClassname}
				title='Close all'
				onClick={() => notificationsStore.clearAll()}
			/>
			<div className='toast-container__list'>{children}</div>
		</div>
	);
}

export default ToastContainer;
