import sys
import requests
from PyQt5.QtWidgets import (QApplication, QMainWindow, QVBoxLayout, QPushButton, 
                             QWidget, QFileDialog, QLabel, QHBoxLayout, QTableWidget, QTableWidgetItem)
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
import matplotlib.pyplot as plt
API_URL = "http://localhost:8000/api"

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Chemical Equipment Analyzer (Desktop)")
        self.setGeometry(100, 100, 1000, 700)
        self.initUI()

    def initUI(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        btn_layout = QHBoxLayout()
        self.upload_btn = QPushButton("Upload CSV")
        self.upload_btn.clicked.connect(self.upload_file)
        btn_layout.addWidget(self.upload_btn)
        
        self.status_label = QLabel("Ready")
        btn_layout.addWidget(self.status_label)
        main_layout.addLayout(btn_layout)
     
        self.stats_label = QLabel("Upload a file to see stats.")
        main_layout.addWidget(self.stats_label)

        self.figure = plt.figure()
        self.canvas = FigureCanvas(self.figure)
        main_layout.addWidget(self.canvas)

    def upload_file(self):
        options = QFileDialog.Options()
        file_path, _ = QFileDialog.getOpenFileName(self, "Open CSV", "", "CSV Files (*.csv);;All Files (*)", options=options)
        
        if file_path:
            self.status_label.setText("Uploading...")
            files = {'file': open(file_path, 'rb')}
            try:
                response = requests.post(f"{API_URL}/upload/", files=files)
                if response.status_code == 201:
                    dataset_id = response.json()['id']
                    self.fetch_data(dataset_id)
                else:
                    self.status_label.setText("Upload Failed")
            except Exception as e:
                self.status_label.setText(f"Error: {e}")

    def fetch_data(self, dataset_id):
        response = requests.get(f"{API_URL}/summary/{dataset_id}/")
        data = response.json()
        stats_text = (f"Total Count: {data['total_count']} | "
                      f"Avg Temp: {data['averages']['avg_temp']:.2f} | "
                      f"Avg Pressure: {data['averages']['avg_press']:.2f}")
        self.stats_label.setText(stats_text)
        self.status_label.setText("Analysis Complete")
        self.figure.clear()
        ax = self.figure.add_subplot(111)
        types = [d['eq_type'] for d in data['distribution']]
        counts = [d['count'] for d in data['distribution']]
        
        ax.bar(types, counts, color=['green', 'blue', 'orange'])
        ax.set_title("Equipment Type Distribution")
        ax.set_ylabel("Count")
        
        self.canvas.draw()

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())
