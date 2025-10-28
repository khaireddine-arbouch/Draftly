import { Reducer} from '@reduxjs/toolkit'
import profileReducer from './profile';
import projectsReducer from './projects';
import shapesReducer from './shapes';

export const slices: Record<string, Reducer> = {
    profile: profileReducer,
    projects: projectsReducer,
    shapes: shapesReducer,
}