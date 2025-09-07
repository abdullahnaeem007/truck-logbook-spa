from rest_framework import serializers

class PlanRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField()
    pickup_location = serializers.CharField()
    dropoff_location = serializers.CharField()
    current_cycle_used_hours = serializers.FloatField(min_value=0, max_value=70)


class SegmentSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['Off', 'Sleeper', 'Driving', 'OnDuty'])
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    miles = serializers.FloatField(required=False)
    label = serializers.CharField(required=False)


class DayPlanSerializer(serializers.Serializer):
    date = serializers.DateField()
    segments = SegmentSerializer(many=True)
    totals = serializers.DictField()


class StopSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=['pickup','drop','fuel','break','rest'])
    name = serializers.CharField()
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    at = serializers.DateTimeField()


class PlanResponseSerializer(serializers.Serializer):
    route_geojson = serializers.DictField() # Feature or FeatureCollection
    stops = StopSerializer(many=True)
    day_plans = DayPlanSerializer(many=True)
    summary = serializers.DictField()