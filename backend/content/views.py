from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ContentBlock
from .serializers import ContentBlockSerializer


class ContentBlockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ContentBlock.objects.filter(actif=True)
    serializer_class = ContentBlockSerializer
    lookup_field = 'type'

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Retourne tous les blocs d'un type donné"""
        content_type = request.query_params.get('type', None)
        if content_type:
            blocks = self.queryset.filter(type=content_type)
            serializer = self.get_serializer(blocks, many=True)
            return Response(serializer.data)
        return Response([])




