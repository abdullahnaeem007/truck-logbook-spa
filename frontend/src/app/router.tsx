import { createBrowserRouter } from 'react-router-dom'
import PlanPage from '../pages/PlanPage'
import ResultsPage from '../pages/ResultsPage'


export const router = createBrowserRouter([
{ path: '/', element: <PlanPage /> },
{ path: '/results', element: <ResultsPage /> },
])