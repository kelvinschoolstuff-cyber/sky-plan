import "./weatherForecast.css";

const weatherDescriptions = {
	0: "Clear sky",
	1: "Mainly clear",
	2: "Partly cloudy",
	3: "Overcast",
	45: "Fog",
	48: "Depositing rime fog",
	51: "Light drizzle",
	53: "Moderate drizzle",
	55: "Dense drizzle",
	61: "Slight rain",
	63: "Moderate rain",
	65: "Heavy rain",
	71: "Slight snow",
	73: "Moderate snow",
	75: "Heavy snow",
	80: "Rain showers",
	81: "Moderate rain showers",
	82: "Violent rain showers",
	95: "Thunderstorm",
	96: "Thunderstorm with hail",
	99: "Thunderstorm with heavy hail",
};

function formatDate(value) {
	return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

function WeeklyForecast({ daily }) {
	const days = daily?.time ?? [];

	return (
		<section className="forecast-section" aria-labelledby="weekly-forecast-title">
			<h2 id="weekly-forecast-title">7-day forecast</h2>
			{days.length ? (
				<div className="forecast-table-wrap">
					<table className="forecast-table">
						<thead>
							<tr>
								<th scope="col">Day</th>
								<th scope="col">Conditions</th>
								<th scope="col">Low</th>
								<th scope="col">High</th>
								<th scope="col">Rainfall</th>
							</tr>
						</thead>
						<tbody>
							{days.map((day, index) => (
								<tr key={day}>
									<th scope="row">{formatDate(day)}</th>
									<td>{weatherDescriptions[daily.weather_code?.[index]] ?? "Conditions unavailable"}</td>
									<td>{daily.temperature_2m_min?.[index] ?? "-"}°C</td>
									<td>{daily.temperature_2m_max?.[index] ?? "-"}°C</td>
									<td>{daily.precipitation_sum?.[index] ?? "-"} mm</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<p className="forecast-empty">7-day forecast is not available.</p>
			)}
		</section>
	);
}

export default WeeklyForecast;
