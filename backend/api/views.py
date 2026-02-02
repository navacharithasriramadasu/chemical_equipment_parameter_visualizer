import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Avg, Count
from .models import Dataset, Equipment
from .serializers import DatasetSerializer 
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from django.http import HttpResponse
import os
from datetime import datetime

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user_id': user.id,
                    'username': user.username
                })
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response({'message': 'Successfully logged out'})
        except:
            return Response({'message': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)

class FileUploadView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_obj = request.FILES['file']
        
        
        if Dataset.objects.count() >= 5:
            oldest = Dataset.objects.order_by('uploaded_at').first()
            oldest.delete()

        
        dataset = Dataset.objects.create(name=file_obj.name, csv_file=file_obj)

       
        try:
            df = pd.read_csv(dataset.csv_file.path)
            equipment_list = [
                Equipment(
                    dataset=dataset,
                    name=row['Equipment Name'],
                    eq_type=row['Type'],
                    flowrate=row['Flowrate'],
                    pressure=row['Pressure'],
                    temperature=row['Temperature']
                )
                for index, row in df.iterrows()
            ]
            Equipment.objects.bulk_create(equipment_list)
            return Response({"status": "success", "id": dataset.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            dataset.delete()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class HistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        datasets = Dataset.objects.order_by('-uploaded_at')[:5]
        history = []
        for dataset in datasets:
            equipments = dataset.equipment.all()
            avg_stats = equipments.aggregate(
                avg_flow=Avg('flowrate'),
                avg_press=Avg('pressure'),
                avg_temp=Avg('temperature')
            )
            history.append({
                'id': dataset.id,
                'name': dataset.name,
                'uploaded_at': dataset.uploaded_at,
                'total_count': equipments.count(),
                'averages': avg_stats
            })
        return Response(history)

class DataSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id)
            equipments = dataset.equipment.all()
            
            total_count = equipments.count()
            avg_stats = equipments.aggregate(
                avg_flow=Avg('flowrate'),
                avg_press=Avg('pressure'),
                avg_temp=Avg('temperature')
            )
            
           
            type_dist = list(equipments.values('eq_type').annotate(count=Count('eq_type')))

            return Response({
                "dataset": dataset.name,
                "total_count": total_count,
                "averages": avg_stats,
                "distribution": type_dist,
                "raw_data": list(equipments.values())[:50] 
            })
        except Dataset.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

class GeneratePDFView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id)
            equipments = dataset.equipment.all()
            
            total_count = equipments.count()
            avg_stats = equipments.aggregate(
                avg_flow=Avg('flowrate'),
                avg_press=Avg('pressure'),
                avg_temp=Avg('temperature')
            )
            type_dist = list(equipments.values('eq_type').annotate(count=Count('eq_type')))
            
            # Create PDF
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="report_{dataset.name}_{datetime.now().strftime("%Y%m%d")}.pdf"'
            
            doc = SimpleDocTemplate(response, pagesize=letter)
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title = Paragraph(f"Equipment Analysis Report: {dataset.name}", styles['Title'])
            elements.append(title)
            elements.append(Spacer(1, 12))
            
            # Summary
            elements.append(Paragraph("Summary Statistics", styles['Heading2']))
            summary_data = [
                ['Total Equipment', str(total_count)],
                ['Average Flowrate', f"{avg_stats['avg_flow']:.2f}"],
                ['Average Pressure', f"{avg_stats['avg_press']:.2f} Pa"],
                ['Average Temperature', f"{avg_stats['avg_temp']:.2f} °C"],
            ]
            summary_table = Table(summary_data, colWidths=[200, 200])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 20))
            
            # Distribution
            elements.append(Paragraph("Equipment Distribution by Type", styles['Heading2']))
            dist_data = [['Type', 'Count']]
            for dist in type_dist:
                dist_data.append([dist['eq_type'], str(dist['count'])])
            
            dist_table = Table(dist_data, colWidths=[200, 200])
            dist_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(dist_table)
            elements.append(Spacer(1, 20))
            
            # Sample Data
            elements.append(Paragraph("Sample Equipment Data (First 20)", styles['Heading2']))
            sample_data = [['Name', 'Type', 'Flowrate', 'Pressure', 'Temperature']]
            for eq in equipments[:20]:
                sample_data.append([
                    eq.name,
                    eq.eq_type,
                    f"{eq.flowrate:.2f}",
                    f"{eq.pressure:.2f}",
                    f"{eq.temperature:.2f}"
                ])
            
            sample_table = Table(sample_data, colWidths=[120, 80, 80, 80, 100])
            sample_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(sample_table)
            
            # Footer
            elements.append(Spacer(1, 20))
            elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            
            doc.build(elements)
            return response
            
        except Dataset.DoesNotExist:
            return Response({"error": "Not found"}, status=404)