from rest_framework import serializers
from .models import Dataset, Equipment

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'name', 'uploaded_at']
