import { Reducer} from '@reduxjs/toolkit'
import profileReducer from './profile';
import projectsReducer from './projects';
import shapesReducer from './shapes';
import viewportReducer from './viewport';
import chatReducer from './chat';
export const slices: Record<string, Reducer> = {
    profile: profileReducer,
    projects: projectsReducer,
    shapes: shapesReducer,
    viewport: viewportReducer,
    chat: chatReducer,
}