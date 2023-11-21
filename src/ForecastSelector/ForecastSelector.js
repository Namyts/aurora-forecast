import classes from './ForecastSelector.module.css'

const ForecastSelector = ({forecastType, setForecastType}) => {
	return (
		<div className={classes['container']}>
			{forecastType}
		</div>
	)
}
export default ForecastSelector