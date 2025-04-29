import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Типизированные хуки для React Redux 9.x
type DispatchFunc = () => AppDispatch;
export const useAppDispatch: DispatchFunc = useDispatch;
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector); 